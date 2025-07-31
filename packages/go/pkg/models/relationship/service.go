package relationship

import (
	"context"
	"fmt"
	"log"
	"lumi/pkg/datastructures"
	"lumi/pkg/dynamo"
	"lumi/pkg/models"
	"lumi/pkg/models/user"
	"lumi/pkg/s3"
	"lumi/pkg/utils"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/samber/lo"
	"github.com/sst/sst/v3/sdk/golang/resource"
)

type RelationshipService struct {
	DynamoTable *dynamo.DynamoTable
	UserService *user.UserService
	Logger      *log.Logger
}

type RelationshipServiceArgs struct {
	DynamoTable   *dynamo.DynamoTable
	UserService   *user.UserService
	StorageBucket s3.BucketAPI
}

func NewRelationshipService(args RelationshipServiceArgs) *RelationshipService {
	dynamoTable, storageBucket, userService := args.DynamoTable, args.StorageBucket, args.UserService
	logger := log.New(os.Stdout, "relationship-service: ", log.LstdFlags)

	if storageBucket == nil {
		bucketName, err := resource.Get("ContentBucket", "name")

		if err != nil {
			logger.Panicf("Could not get the content bucket name: %v\n", err)
		}

		storageBucket = s3.NewBucket(s3.NewBucketArgs{
			BucketName: bucketName.(string),
		})
	}

	if userService == nil {
		userService = user.NewUserService(dynamoTable, storageBucket)
	}

	return &RelationshipService{
		DynamoTable: dynamoTable,
		UserService: userService,
		Logger:      logger,
	}
}

func (rs *RelationshipService) GetRelationshipById(ctx context.Context, relationshipId string) (*RelationshipRecord, error) {
	keys := RelationshipKeys{}
	return dynamo.GetItem[RelationshipRecord](rs.DynamoTable, dynamo.GetItemArgs{
		Ctx: ctx,
		PK:  keys.PK(relationshipId),
		SK:  keys.PK(relationshipId),
	})
}

func (rs *RelationshipService) UserInRelationship(ctx context.Context, userId string) (bool, error) {
	user, err := rs.UserService.GetNonNilUserById(ctx, user.GetUserByIdArgs{
		UserId:      userId,
		Projections: []string{"relationshipId"},
	})

	if err != nil {
		return false, err
	}

	return lo.Ternary(user.RelationshipId != "", true, false), nil
}

func (rs *RelationshipService) GetRelationshipForUser(ctx context.Context, userId string) (*RelationshipRecord, error) {
	user, err := rs.UserService.GetNonNilUserById(ctx, user.GetUserByIdArgs{
		UserId:      userId,
		Projections: []string{"relationshipId"},
	})

	if err != nil || user.RelationshipId == "" {
		return nil, err
	}

	return rs.GetRelationshipById(ctx, user.RelationshipId)
}

func (rs *RelationshipService) GetPartnerForUser(ctx context.Context, userId string) (*user.UserRecord, error) {
	relationship, err := rs.GetRelationshipForUser(ctx, userId)

	if err != nil || relationship == nil {
		return nil, err
	}

	return rs.UserService.GetUserById(ctx, user.GetUserByIdArgs{
		UserId: lo.Ternary(relationship.Partner1 == userId, relationship.Partner2, relationship.Partner1),
	})
}

func (rs *RelationshipService) GetRelationshipRequestBySenderAndReceiver(ctx context.Context, senderId, receiverId string) (*RelationshipRequestRecord, error) {
	keys := RelationshipRequestKeys{}
	requests, err := dynamo.GetItems(
		rs.DynamoTable,
		dynamo.GetItemsParams[RelationshipRequestRecord]{
			Ctx:   ctx,
			Index: lo.ToPtr(dynamo.GSI1),
			QueryExpression: dynamo.DynamoQueryExpression{
				Expression: "#gsi1pk = :gsi1pk and #gsi1sk = :gsi1sk",
				Variables: map[string]any{
					":gsi1pk": keys.GSI1PK(),
					":gsi1sk": keys.GSI1SK(senderId),
				},
				Filter: &dynamo.DynamoQueryFilterExpression{
					Expression: "#gsi2pk = :gsi2pk and #gsi2sk = :gsi2sk",
					Variables: map[string]any{
						":gsi2pk": keys.GSI2PK(),
						":gsi2sk": keys.GSI2SK(receiverId),
					},
				},
			},
			Limit: lo.ToPtr(int32(1)),
		},
	)

	if err != nil {
		return nil, err
	}

	if data := requests.Data; len(data) == 0 {
		return nil, nil
	} else {
		return &data[0], nil
	}
}

func (rs *RelationshipService) UserHasRequestFromUser(ctx context.Context, userId, senderId string) (bool, error) {
	relationshipRequest, err := rs.GetRelationshipRequestBySenderAndReceiver(ctx, senderId, userId)

	if err != nil {
		return false, err
	}

	return relationshipRequest != nil, nil
}

func (rs *RelationshipService) SendRelationshipRequest(ctx context.Context, senderId, receiverId string) (*RelationshipRequestRecord, error) {
	if senderId == receiverId {
		return nil, &models.ServiceError{
			StatusCode: http.StatusBadRequest,
			Message:    "You cannot send a relationship request to yourself!",
		}
	}

	if senderInRship, err := rs.UserInRelationship(ctx, senderId); err != nil {
		return nil, err
	} else if senderInRship {
		return nil, &models.ServiceError{
			StatusCode: http.StatusBadRequest,
			Message:    "You are already in a relationship!",
		}
	}

	if receiverInRship, err := rs.UserInRelationship(ctx, receiverId); err != nil {
		return nil, err
	} else if receiverInRship {
		return nil, &models.ServiceError{
			StatusCode: http.StatusBadRequest,
			Message:    "User is already in a relationship!",
		}
	}

	if receiverHasRequest, err := rs.UserHasRequestFromUser(ctx, receiverId, senderId); err != nil {
		return nil, err
	} else if receiverHasRequest {
		return nil, &models.ServiceError{
			StatusCode: http.StatusBadRequest,
			Message:    "You have already sent this user a request!",
		}
	}

	reuqestFromReceiver, err := rs.GetRelationshipRequestBySenderAndReceiver(ctx, receiverId, senderId)
	if err != nil {
		return nil, err
	} else if reuqestFromReceiver != nil {
		_, err = rs.AcceptRelationshipRequest(ctx, receiverId, reuqestFromReceiver.Id)
		if err != nil {
			return nil, err
		}

		return nil, nil
	}

	id := utils.GetUUID()
	keys := RelationshipRequestKeys{}
	res, err := dynamo.PutItem(
		rs.DynamoTable,
		dynamo.PutItemArgs[RelationshipRequestRecord]{
			Ctx: ctx,
			Item: RelationshipRequestRecord{
				DynamoPrimaryKey: dynamo.DynamoPrimaryKey{
					PK: keys.PK(id),
					SK: keys.SK(id),
				},
				DynamoGSI1Keys: dynamo.DynamoGSI1Keys{
					GSI1PK: keys.GSI1PK(),
					GSI1SK: keys.GSI1SK(senderId),
				},
				DynamoGSI2Keys: dynamo.DynamoGSI2Keys{
					GSI2PK: keys.GSI2PK(),
					GSI2SK: keys.GSI2SK(receiverId),
				},
				DynamoEntityType: dynamo.DynamoEntityType{
					EntityType: EntityTypeRelationshipRequestRecord,
				},
				Id:        id,
				Sender:    senderId,
				Receiver:  receiverId,
				CreatedAt: time.Now(),
			},
		},
	)

	if err != nil {
		return nil, err
	}

	return res, nil
}

func (rs *RelationshipService) GetRelationshipRequestById(ctx context.Context, requestId string) (*RelationshipRequestRecord, error) {
	keys := RelationshipRequestKeys{}
	res, err := dynamo.GetItem[RelationshipRequestRecord](rs.DynamoTable, dynamo.GetItemArgs{
		Ctx: ctx,
		PK:  keys.PK(requestId),
		SK:  keys.SK(requestId),
	})

	if err != nil {
		return nil, err
	}

	return res, nil
}

func (rs *RelationshipService) GetReceivedRelationshipRequestForUser(ctx context.Context, userId string, dto GetRelationshipRequestsForUserDto) (*dynamo.InfiniteData[RelationshipRequestRecord], error) {
	return rs.getRelationshipRequestsForUser(ctx, userId, GetRelationshipRequestsForUserArgs{
		Dto:   dto,
		Index: GetRelationshipRequestsIndexGSI2,
	})
}

func (rs *RelationshipService) GetSentRelationshipRequestForUser(ctx context.Context, userId string, dto GetRelationshipRequestsForUserDto) (*dynamo.InfiniteData[RelationshipRequestRecord], error) {
	return rs.getRelationshipRequestsForUser(ctx, userId, GetRelationshipRequestsForUserArgs{
		Dto:   dto,
		Index: GetRelationshipRequestsIndexGSI1,
	})
}

type GetRelationshipRequestsIndex string

const (
	GetRelationshipRequestsIndexGSI1 GetRelationshipRequestsIndex = GetRelationshipRequestsIndex(dynamo.GSI1)
	GetRelationshipRequestsIndexGSI2 GetRelationshipRequestsIndex = GetRelationshipRequestsIndex(dynamo.GSI2)
)

type GetRelationshipRequestsForUserArgs struct {
	Dto   GetRelationshipRequestsForUserDto
	Index GetRelationshipRequestsIndex
}

func (rs *RelationshipService) getRelationshipRequestsForUser(ctx context.Context, userId string, args GetRelationshipRequestsForUserArgs) (*dynamo.InfiniteData[RelationshipRequestRecord], error) {
	dto, indexLower := args.Dto, strings.ToLower(string(args.Index))

	keys := RelationshipRequestKeys{}

	res, err := dynamo.GetItems(
		rs.DynamoTable,
		dynamo.GetItemsParams[RelationshipRequestRecord]{
			Ctx:   ctx,
			Index: lo.ToPtr(dynamo.DynamoTableIndex(args.Index)),
			QueryExpression: dynamo.DynamoQueryExpression{
				Expression: fmt.Sprintf("#%spk = :%spk AND #%ssk = :%ssk", indexLower, indexLower, indexLower, indexLower),
				Variables: map[string]any{
					fmt.Sprintf(":%spk", indexLower): lo.Ternary(
						args.Index == GetRelationshipRequestsIndex(dynamo.GSI1),
						keys.GSI1PK(),
						keys.GSI2PK(),
					),
					fmt.Sprintf(":%ssk", indexLower): lo.Ternary(
						args.Index == GetRelationshipRequestsIndex(dynamo.GSI1),
						keys.GSI1SK(userId),
						keys.GSI2SK(userId),
					),
				},
			},
			Limit:  lo.ToPtr(int32(dto.Limit)),
			Cursor: dto.Cursor,
		},
	)

	if err != nil {
		return nil, err
	}

	data := res.Data
	fetchedUsers := make(map[string]RelationshipRequestOtherUser)
	userKeys := user.UserKeys{}

	userIds := datastructures.NewSet()
	lo.ForEach(
		data,
		func(request RelationshipRequestRecord, _ int) {
			if request.Sender != userId {
				userIds.Add(request.Sender)
			} else {
				userIds.Add(request.Receiver)
			}
		},
	)

	usersRes := dynamo.BatchGetItems[user.UserRecord](
		rs.DynamoTable,
		dynamo.BatchGetItemsArgs{
			Ctx: ctx,
			Keys: lo.Map(
				userIds.List(),
				func(id string, _ int) dynamo.DynamoPrimaryKey {
					return dynamo.DynamoPrimaryKey{
						PK: userKeys.PK(id),
						SK: userKeys.SK(id),
					}
				},
			),
			ChunkSize: lo.ToPtr(25),
		},
	)

	for _, user := range usersRes {
		fetchedUsers[user.Id] = RelationshipRequestOtherUser{
			Id:        user.Id,
			Username:  user.Username,
			FirstName: user.FirstName,
			LastName:  user.LastName,
		}
	}

	for idx, request := range data {
		otherUser, ok := fetchedUsers[lo.Ternary(request.Sender == userId, request.Receiver, request.Sender)]

		if ok {
			data[idx].OtherUser = &otherUser
		}
	}

	return &dynamo.InfiniteData[RelationshipRequestRecord]{
		Data:       data,
		NextCursor: res.NextCursor,
	}, nil
}

func (rs *RelationshipService) DeleteRelationshipRequestById(ctx context.Context, userId, requestId string) (bool, error) {
	request, err := rs.GetRelationshipRequestById(ctx, requestId)

	if err != nil {
		return false, err
	} else if request == nil {
		return false, &models.ServiceError{
			StatusCode: http.StatusNotFound,
			Message:    "Relationship request not found!",
		}
	} else if request.Receiver != userId && request.Sender != userId {
		return false, &models.ServiceError{
			StatusCode: http.StatusForbidden,
			Message:    "You are not allowed to delete this relationship request!",
		}
	}

	return rs.RemoveRelationshipRequestById(ctx, requestId)
}

func (rs *RelationshipService) RemoveRelationshipRequestById(ctx context.Context, requestId string) (bool, error) {
	keys := RelationshipRequestKeys{}
	return dynamo.DeleteItem(rs.DynamoTable, dynamo.DeleteItemArgs{
		Ctx: ctx,
		PK:  keys.PK(requestId),
		SK:  keys.SK(requestId),
	})
}

func (rs *RelationshipService) AcceptRelationshipRequest(ctx context.Context, userId, requestId string) (*RelationshipRecord, error) {
	request, err := rs.GetRelationshipRequestById(ctx, requestId)

	if err != nil {
		return nil, err
	} else if request == nil {
		return nil, &models.ServiceError{
			StatusCode: http.StatusNotFound,
			Message:    "Relationship request not found!",
		}
	} else if request.Receiver != userId {
		return nil, &models.ServiceError{
			StatusCode: http.StatusForbidden,
			Message:    "You are not allowed to accept this relationship request!",
		}
	}

	sender, err := rs.UserService.GetUserById(ctx, user.GetUserByIdArgs{
		UserId:      request.Sender,
		Projections: []string{"id"},
	})

	if err != nil {
		return nil, err
	}

	receiver, err := rs.UserService.GetUserById(ctx, user.GetUserByIdArgs{
		UserId:      request.Receiver,
		Projections: []string{"id"},
	})

	if err != nil {
		return nil, err
	}

	relationshipId,
		relationshipKeys,
		relationshipRequestKeys,
		userKeys := utils.GetUUID(), RelationshipKeys{}, RelationshipRequestKeys{}, user.UserKeys{}

	relationship := RelationshipRecord{
		DynamoPrimaryKey: dynamo.DynamoPrimaryKey{
			PK: relationshipKeys.PK(relationshipId),
			SK: relationshipKeys.SK(relationshipId),
		},
		DynamoEntityType: dynamo.DynamoEntityType{
			EntityType: EntityTypeRelationshipRecord,
		},
		Id:        relationshipId,
		Partner1:  sender.Id,
		Partner2:  receiver.Id,
		CreatedAt: time.Now(),
	}

	_, err = dynamo.WriteTransaction(
		rs.DynamoTable,
		ctx,
		dynamo.WriteTransactionArgs{
			Put: &dynamo.WritePutArgs{
				Item: relationship,
			},
		},
		dynamo.WriteTransactionArgs{
			Delete: &dynamo.WriteDeleteArgs{
				PK: relationshipRequestKeys.PK(requestId),
				SK: relationshipRequestKeys.PK(requestId),
			},
		},
		dynamo.WriteTransactionArgs{
			Update: &dynamo.WriteUpdateArgs{
				PK: userKeys.PK(sender.Id),
				SK: userKeys.SK(sender.Id),
				Update: user.UpdateableUserRecord{
					RelationshipId: dynamo.NewUpdateValue(relationshipId),
				},
			},
		},
		dynamo.WriteTransactionArgs{
			Update: &dynamo.WriteUpdateArgs{
				PK: userKeys.PK(receiver.Id),
				SK: userKeys.SK(receiver.Id),
				Update: user.UpdateableUserRecord{
					RelationshipId: dynamo.NewUpdateValue(relationshipId),
				},
			},
		},
	)

	if err != nil {
		return nil, err
	}

	return &relationship, nil
}

func (rs *RelationshipService) DeleteUserRelationship(ctx context.Context, userId string) (*RelationshipRecord, error) {
	relationship, err := rs.GetRelationshipForUser(ctx, userId)

	if err != nil {
		return nil, err
	} else if relationship == nil {
		return nil, &models.ServiceError{
			StatusCode: http.StatusNotFound,
			Message:    "Relationship not found",
		}
	}

	relationshipKeys, userKeys := RelationshipKeys{}, user.UserKeys{}

	_, err = dynamo.WriteTransaction(
		rs.DynamoTable,
		ctx,
		dynamo.WriteTransactionArgs{
			Delete: &dynamo.WriteDeleteArgs{
				PK: relationshipKeys.PK(relationship.Id),
				SK: relationshipKeys.SK(relationship.Id),
			},
		},
		dynamo.WriteTransactionArgs{
			Update: &dynamo.WriteUpdateArgs{
				PK: userKeys.PK(relationship.Partner1),
				SK: userKeys.SK(relationship.Partner1),
				Update: user.UpdateableUserRecord{
					RelationshipId: dynamo.NewRemoveValue[string](),
				},
			},
		},
		dynamo.WriteTransactionArgs{
			Update: &dynamo.WriteUpdateArgs{
				PK: userKeys.PK(relationship.Partner2),
				SK: userKeys.SK(relationship.Partner2),
				Update: user.UpdateableUserRecord{
					RelationshipId: dynamo.NewRemoveValue[string](),
				},
			},
		},
	)

	if err != nil {
		return nil, err
	}

	return relationship, nil
}

func (rs *RelationshipService) UpdateRelationship(ctx context.Context, relationshipId string, dto UpdateRelationshipDto) (*RelationshipRecord, error) {
	relationshipKeys := RelationshipKeys{}
	update := UpdateableRelationshipRecord{}

	if dto.Anniversary != nil {
		newAnniversary, err := time.Parse(time.RFC3339, *dto.Anniversary)

		if err != nil {
			return nil, err
		}

		mmDD := utils.DateToMMDD(newAnniversary)
		update.Anniversary = dynamo.NewUpdateValue(*dto.Anniversary)
		update.AnniversaryMMDD = dynamo.NewUpdateValue(mmDD)
		update.GSI1PK = dynamo.NewUpdateValue(relationshipKeys.GSI1PK())
		update.GSI1SK = dynamo.NewUpdateValue(relationshipKeys.GSI1SK(mmDD, relationshipId))
	}

	return dynamo.UpdateItem[RelationshipRecord](
		rs.DynamoTable,
		dynamo.UpdateItemArgs{
			Ctx:        ctx,
			PK:         relationshipKeys.PK(relationshipId),
			SK:         relationshipKeys.SK(relationshipId),
			UpdateBody: update,
		},
	)
}

func (rs *RelationshipService) GetAnniversaryRelationships(ctx context.Context, anniversary time.Time) ([]RelationshipRecord, error) {
	mmDD := utils.DateToMMDD(anniversary)
	relationshipKeys := RelationshipKeys{}
	res, err := dynamo.GetItems(
		rs.DynamoTable,
		dynamo.GetItemsParams[RelationshipRecord]{
			Ctx:   ctx,
			Index: lo.ToPtr(dynamo.GSI1),
			QueryExpression: dynamo.DynamoQueryExpression{
				Expression: "#gsi1pk = :gsi1pk and begins_with(#gsi1sk, :gsi1sk)",
				Variables: map[string]any{
					":gsi1pk": relationshipKeys.GSI1PK(),
					":gsi1sk": relationshipKeys.BuildKey(mmDD),
				},
			},
		},
	)

	if err != nil || len(res.Data) == 0 {
		return nil, err
	} else {
		return res.Data, nil
	}
}
