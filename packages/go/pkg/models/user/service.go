package user

import (
	"context"
	"errors"
	"fmt"
	"log"
	"lumi/pkg/dynamo"
	"lumi/pkg/models"
	"lumi/pkg/s3"
	"lumi/pkg/utils"
	"mime"
	"net/http"
	"os"
	"time"

	v4 "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	"github.com/samber/lo"
)

type UserService struct {
	DynamoTable   *dynamo.DynamoTable
	StorageBucket s3.BucketAPI
	Logger        *log.Logger
}

func NewUserService(dynamoTable *dynamo.DynamoTable, storageBucket s3.BucketAPI) *UserService {
	logger := log.New(os.Stdout, "user-service: ", log.LstdFlags)
	return &UserService{
		DynamoTable:   dynamoTable,
		StorageBucket: storageBucket,
		Logger:        logger,
	}
}

type CreateUserArgs struct {
	Dto     CreateUserDto
	SendOTP *bool
}

func (service *UserService) CreateUser(ctx context.Context, args CreateUserArgs) (*UserRecord, error) {
	dto := args.Dto
	existingUser, err := service.GetUserByEmail(ctx, dto.Email)

	if err != nil {
		return nil, err
	}

	if existingUser != nil {
		return nil, &models.ServiceError{
			StatusCode: http.StatusBadRequest,
			Message:    "User with that email already exists",
		}
	}

	existingUser, err = service.GetUserByUsername(ctx, dto.Username)

	if err != nil {
		return nil, err
	}

	if existingUser != nil {
		return nil, &models.ServiceError{
			StatusCode: http.StatusBadRequest,
			Message:    "User with that username already exists",
		}
	}

	userId := lo.TernaryF(dto.Id != nil, func() string {
		return *dto.Id
	}, func() string {
		return utils.GetUUID()
	})
	createdAt := time.Now()
	updatedAt := createdAt

	userKeys := UserKeys{}
	return dynamo.PutItem(
		service.DynamoTable,
		dynamo.PutItemArgs[UserRecord]{
			Ctx: ctx,
			Item: UserRecord{
				DynamoPrimaryKey: dynamo.DynamoPrimaryKey{
					PK: userKeys.PK(userId),
					SK: userKeys.SK(userId),
				},
				DynamoGSI1Keys: dynamo.DynamoGSI1Keys{
					GSI1PK: userKeys.GSI1PK(),
					GSI1SK: userKeys.GSI1SK(dto.Username),
				},
				DynamoGSI2Keys: dynamo.DynamoGSI2Keys{
					GSI2PK: userKeys.GSI2PK(),
					GSI2SK: userKeys.GSI2SK(dto.Email),
				},
				DynamoEntityType: dynamo.DynamoEntityType{
					EntityType: EntityTypeUserRecord,
				},
				Id:        userId,
				Email:     dto.Email,
				Username:  dto.Username,
				FirstName: dto.FirstName,
				LastName:  dto.LastName,
				CreatedAt: createdAt,
				UpdatedAt: updatedAt,
			},
		},
	)
}

type GetUserByIdArgs struct {
	UserId      string
	Projections []string
}

func (service *UserService) GetUserById(ctx context.Context, args GetUserByIdArgs) (*UserRecord, error) {
	userKeys := UserKeys{}
	res, err := dynamo.GetItem[UserRecord](service.DynamoTable, dynamo.GetItemArgs{
		Ctx:                 ctx,
		PK:                  userKeys.PK(args.UserId),
		SK:                  userKeys.SK(args.UserId),
		ProjectedAttributes: args.Projections,
	})

	if err != nil {
		return nil, err
	}

	err = service.attachAvatarToUser(res)

	if err != nil {
		return nil, err
	}

	return res, nil
}

func (service *UserService) GetNonNilUserById(ctx context.Context, args GetUserByIdArgs) (*UserRecord, error) {
	user, err := service.GetUserById(ctx, args)

	if err != nil {
		return nil, err
	}

	if user == nil {
		return nil, &models.ServiceError{
			StatusCode: http.StatusNotFound,
			Message:    "User not found",
		}
	}

	return user, nil
}

func (service *UserService) GetUsersByUsername(ctx context.Context, dto GetUsersByUsernameDto) (*dynamo.InfiniteData[UserRecord], error) {
	userKeys := UserKeys{}
	return dynamo.GetItems(service.DynamoTable, dynamo.GetItemsParams[UserRecord]{
		Ctx:   ctx,
		Index: lo.ToPtr(dynamo.GSI1),
		QueryExpression: dynamo.DynamoQueryExpression{
			Expression: "#gsi1pk = :gsi1pk AND begins_with(#gsi1sk, :gsi1sk)",
			Variables: map[string]any{
				":gsi1pk": userKeys.GSI1PK(),
				":gsi1sk": userKeys.GSI1SK(dto.Username),
			},
		},
		Limit:               lo.ToPtr(int32(dto.Limit)),
		Cursor:              dto.Cursor,
		ProjectedAttributes: dto.Projections,
		Mapper: func(ur UserRecord) UserRecord {
			err := service.attachAvatarToUser(&ur)
			service.Logger.Printf("There was an error attaching avatar to user: %v\n%v\v", ur.Username, err)
			return ur
		},
	})
}

func (service *UserService) GetUserByUsername(ctx context.Context, username string) (*UserRecord, error) {
	userKeys := UserKeys{}
	res, err := dynamo.GetItems(service.DynamoTable, dynamo.GetItemsParams[UserRecord]{
		Ctx:   ctx,
		Index: lo.ToPtr(dynamo.GSI1),
		QueryExpression: dynamo.DynamoQueryExpression{
			Expression: "#gsi1pk = :gsi1pk AND #gsi1sk = :gsi1sk",
			Variables: map[string]any{
				":gsi1pk": userKeys.GSI1PK(),
				":gsi1sk": userKeys.GSI1SK(username),
			},
		},
		Limit: lo.ToPtr[int32](1),
		Mapper: func(ur UserRecord) UserRecord {
			err := service.attachAvatarToUser(&ur)
			service.Logger.Printf("There was an error attaching avatar to user: %v\n%v\v", ur.Username, err)
			return ur
		},
	})

	if err != nil {
		return nil, err
	}

	if data := res.Data; len(data) > 0 {
		return &data[0], nil
	}

	return nil, nil
}

func (service *UserService) GetUsersByEmail(ctx context.Context, dto GetUsersByEmailDto) (*dynamo.InfiniteData[UserRecord], error) {
	userKeys := UserKeys{}
	return dynamo.GetItems(service.DynamoTable, dynamo.GetItemsParams[UserRecord]{
		Ctx:   ctx,
		Index: lo.ToPtr(dynamo.GSI2),
		QueryExpression: dynamo.DynamoQueryExpression{
			Expression: "#gsi2pk = :gsi2pk AND begins_with(#gsi2sk, :gsi2sk)",
			Variables: map[string]any{
				":gsi2pk": userKeys.GSI2PK(),
				":gsi2sk": userKeys.GSI2SK(dto.Email),
			},
		},
		Limit:               lo.ToPtr(int32(dto.Limit)),
		Cursor:              dto.Cursor,
		ProjectedAttributes: dto.Projections,
		Mapper: func(ur UserRecord) UserRecord {
			err := service.attachAvatarToUser(&ur)
			service.Logger.Printf("There was an error attaching avatar to user: %v\n%v\v", ur.Username, err)
			return ur
		},
	})
}

func (service *UserService) GetUserByEmail(ctx context.Context, email string) (*UserRecord, error) {
	userKeys := UserKeys{}
	res, err := dynamo.GetItems(service.DynamoTable, dynamo.GetItemsParams[UserRecord]{
		Ctx:   ctx,
		Index: lo.ToPtr(dynamo.GSI2),
		QueryExpression: dynamo.DynamoQueryExpression{
			Expression: "#gsi2pk = :gsi2pk AND #gsi2sk = :gsi2sk",
			Variables: map[string]any{
				":gsi2pk": userKeys.GSI2PK(),
				":gsi2sk": userKeys.GSI2SK(email),
			},
		},
		Limit: lo.ToPtr[int32](1),
		Mapper: func(ur UserRecord) UserRecord {
			err := service.attachAvatarToUser(&ur)
			service.Logger.Printf("There was an error attaching avatar to user: %v\n%v\v", ur.Username, err)
			return ur
		},
	})

	if err != nil {
		return nil, err
	}

	if data := res.Data; len(data) > 0 {
		return &data[0], nil
	}

	return nil, nil
}

func (service *UserService) UserExists(ctx context.Context, userIdentifier string) (bool, error) {
	user, err := service.GetUserById(ctx, GetUserByIdArgs{
		UserId: userIdentifier,
	})

	if err != nil {
		return false, err
	}

	if user != nil {
		return true, nil
	}

	user, err = service.GetUserByEmailOrUsername(ctx, userIdentifier)

	if err != nil {
		return false, err
	}

	return lo.Ternary(user != nil, true, false), nil
}

func (service *UserService) GetUserByEmailOrUsername(ctx context.Context, emailOrUsername string) (*UserRecord, error) {
	user, err := service.GetUserByEmail(ctx, emailOrUsername)

	if err != nil {
		return nil, err
	} else if user == nil {
		user, err = service.GetUserByUsername(ctx, emailOrUsername)
		if err != nil {
			return nil, err
		}
	}

	return user, nil
}

func (service *UserService) UpdateUser(ctx context.Context, userId string, dto UpdateUserDto) (*UserRecord, error) {
	userExists, err := service.UserExists(ctx, userId)
	if err != nil {
		return nil, err
	}

	if !userExists {
		return nil, &models.ServiceError{
			StatusCode: http.StatusNotFound,
			Message:    "User not found",
		}
	}

	updateTime := time.Now()
	var updateBody UpdateableUserRecord

	if err := dynamo.TransformToUpdateable(dto, &updateBody); err != nil {
		return nil, err
	}

	updateBody.UpdatedAt = dynamo.NewUpdateValue(updateTime)

	userKeys := UserKeys{}
	return dynamo.UpdateItem[UserRecord](service.DynamoTable, dynamo.UpdateItemArgs{
		Ctx:        ctx,
		PK:         userKeys.PK(userId),
		SK:         userKeys.SK(userId),
		UpdateBody: updateBody,
	})
}

// After this function has been successfully called, a call must be made to RelationshipService#DeleteUserRelationship
func (service *UserService) DeleteUser(ctx context.Context, userId string) (bool, error) {
	userKeys := UserKeys{}
	return dynamo.DeleteItem(service.DynamoTable, dynamo.DeleteItemArgs{
		Ctx: ctx,
		PK:  userKeys.PK(userId),
		SK:  userKeys.SK(userId),
	})
}

type GetUserAvatarUploadUrlArgs struct {
	models.GetUploadUrlDto
	UserId string
}

func (service *UserService) GetUserAvatarUploadUrl(ctx context.Context, args GetUserAvatarUploadUrlArgs) (*v4.PresignedHTTPRequest, error) {
	if service.StorageBucket == nil {
		return nil, &models.ServiceError{
			StatusCode: http.StatusBadRequest,
			Message:    "Could not generate an avatar upload URL because in the current context, the storage bucket is not available.",
		}
	}

	key, err := s3.ContentPathsUserAvatar(args.UserId, fmt.Sprintf("%s.%s", args.ObjectKey, args.FileExtension))
	if err != nil {
		return nil, err
	}

	return service.StorageBucket.GetSignedPutURL(ctx, s3.GetSignedURLArgs{
		Key:       key,
		ExpiresIn: lo.ToPtr(5 * time.Minute),
		ContentType: lo.Ternary(
			args.FileExtension != "",
			lo.ToPtr(mime.TypeByExtension("."+args.FileExtension)),
			nil,
		),
	})
}

func (service *UserService) attachAvatarToUser(ur *UserRecord) error {
	if ur == nil {
		return errors.New("user not found")
	}

	if ur.AvatarKey != "" {
		url, err := s3.ContentPathsUserAvatar(ur.Id, ur.AvatarKey, s3.ReplaceVariablesOpts{
			WithHost: lo.ToPtr(true),
		})

		if err != nil {
			return err
		}

		ur.AvatarUrl = lo.ToPtr(url)
	}

	return nil
}
