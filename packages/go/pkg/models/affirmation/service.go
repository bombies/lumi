package affirmation

import (
	"context"
	"crypto/rand"
	"encoding/binary"
	"fmt"
	"log"
	"lumi/pkg/dynamo"
	"lumi/pkg/models"
	"lumi/pkg/models/notification"
	"lumi/pkg/models/relationship"
	"lumi/pkg/models/user"
	"lumi/pkg/utils"
	"lumi/pkg/websockets"
	"math"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/samber/lo"
	"github.com/samber/lo/mutable"
)

type AffirmationService struct {
	DynamoTable         *dynamo.DynamoTable
	RelationshipService *relationship.RelationshipService
	WebsocketService    *websockets.WebsocketService
	NotificationService *notification.NotificationService
	Logger              *log.Logger
}

type AffirmationServiceArgs struct {
	DynamoTable         *dynamo.DynamoTable
	RelationshipService *relationship.RelationshipService
	WebsocketService    *websockets.WebsocketService
	NotificationService *notification.NotificationService
}

func NewAffirmationService(args AffirmationServiceArgs) *AffirmationService {
	dynamoTable,
		relationshipService,
		notificationService,
		ws := args.DynamoTable, args.RelationshipService, args.NotificationService, args.WebsocketService

	if dynamoTable == nil {
		panic("DynamoTable is required for the AffirmationService")
	}

	if relationshipService == nil {
		relationshipService = relationship.NewRelationshipService(relationship.RelationshipServiceArgs{
			DynamoTable: dynamoTable,
			UserService: user.NewUserService(dynamoTable, nil),
		})
	}

	if notificationService == nil {
		notificationService = notification.NewNotificationService(dynamoTable)
	}

	if ws == nil {
		ws = websockets.NewSocketService(dynamoTable)
	}

	logger := log.New(os.Stdout, "affirmation-service: ", log.LstdFlags)
	return &AffirmationService{
		DynamoTable:         dynamoTable,
		RelationshipService: relationshipService,
		WebsocketService:    ws,
		Logger:              logger,
	}
}

func (as *AffirmationService) CreateAffirmation(ctx context.Context, userId string, dto CreateAffirmationDto) (*AffirmationRecord, error) {
	userRelationship, err := as.RelationshipService.GetRelationshipForUser(ctx, userId)

	if err != nil {
		return nil, err
	}

	if userRelationship == nil {
		return nil, &models.ServiceError{
			StatusCode: http.StatusBadRequest,
			Message:    "You aren't in a relationship!",
		}
	}

	id, keys := utils.GetUUID(), AffirmationKeys{}
	return dynamo.PutItem(as.DynamoTable, dynamo.PutItemArgs[AffirmationRecord]{
		Ctx: ctx,
		Item: AffirmationRecord{
			DynamoPrimaryKey: dynamo.DynamoPrimaryKey{
				PK: keys.PK(userRelationship.Id),
				SK: keys.SK(userId, userRelationship.Id),
			},
			DynamoEntityType: dynamo.DynamoEntityType{
				EntityType: EntityTypeAffirmation,
			},
			Id:             id,
			Affirmation:    dto.Affirmation,
			SelectedCount:  0,
			RelationshipId: userRelationship.Id,
			OwnerId:        userId,
		},
	})
}

func (as *AffirmationService) GetAffirmationById(ctx context.Context, ownerId, relationshipId, affirmationId string) (*AffirmationRecord, error) {
	keys := AffirmationKeys{}
	return dynamo.GetItem[AffirmationRecord](as.DynamoTable, dynamo.GetItemArgs{
		Ctx: ctx,
		PK:  keys.PK(relationshipId),
		SK:  keys.SK(ownerId, relationshipId),
	})
}

func (as *AffirmationService) SelectAffirmation(ctx context.Context, userId string) (*AffirmationRecord, error) {
	affirmations, err := as.GetAffirmationsFromPartner(ctx, userId)

	if err != nil {
		return nil, err
	}

	weights := lo.Map(affirmations, func(affirmation AffirmationRecord, _ int) float64 { return 1 / float64(affirmation.SelectedCount+1) })
	totalWeight := lo.Sum(weights)

	b := make([]byte, 8)
	_, err = rand.Read(b)
	if err != nil {
		return nil, err
	}

	randomInt := binary.BigEndian.Uint64(b)
	randomFloat := float64(randomInt) / float64(math.MaxUint64)
	r, cumulative := randomFloat*totalWeight, 0.0

	mutable.Shuffle(affirmations)
	for i, affirmation := range affirmations {
		cumulative += weights[i]
		if r <= cumulative {
			_, err := as.UpdateAffirmation(
				ctx,
				affirmation.OwnerId,
				affirmation.RelationshipId,
				affirmation.Id,
				UpdateAffirmationDto{
					SelectedCount: lo.ToPtr(affirmation.SelectedCount + 1),
				},
			)

			if err != nil {
				return nil, err
			}

			return &affirmation, nil
		}
	}

	return nil, nil
}

func (as *AffirmationService) GetOwnedAffirmationsForUser(ctx context.Context, userId string, rship ...relationship.RelationshipRecord) ([]AffirmationRecord, error) {
	var relationship *relationship.RelationshipRecord
	if len(rship) == 0 {
		fetchedRelationship, err := as.RelationshipService.GetRelationshipForUser(ctx, userId)
		if err != nil {
			return nil, err
		}
		relationship = fetchedRelationship
	} else {
		relationship = &rship[0]
	}

	if relationship == nil {
		return nil, &models.ServiceError{
			StatusCode: http.StatusBadRequest,
			Message:    "You aren't in a relationship!",
		}
	}

	if userId != relationship.Partner1 && userId != relationship.Partner2 {
		return nil, &models.ServiceError{
			StatusCode: http.StatusBadRequest,
			Message:    "You aren't in this relationship!",
		}
	}

	keys := AffirmationKeys{}
	res, err := dynamo.GetItems(as.DynamoTable, dynamo.GetItemsParams[AffirmationRecord]{
		Ctx: ctx,
		QueryExpression: dynamo.DynamoQueryExpression{
			Expression: "#pk = :pk and begins_with(#sk, :sk)",
			Variables: map[string]any{
				":pk": keys.PK(relationship.Id),
				":sk": keys.BuildKey(userId),
			},
		},
		Exhaustive: lo.ToPtr(true),
	})

	if err != nil {
		return nil, err
	}

	return res.Data, nil
}

func (as *AffirmationService) GetAffirmationsFromPartner(ctx context.Context, userId string) ([]AffirmationRecord, error) {
	relationshipRecord, err := as.RelationshipService.GetRelationshipForUser(ctx, userId)

	if err != nil {
		return nil, err
	}

	if relationshipRecord == nil {
		return nil, &models.ServiceError{
			StatusCode: http.StatusBadRequest,
			Message:    "You aren't in a relationship!",
		}
	}

	partnerId := relationship.ExtractPartnerIdFromRelationship(userId, *relationshipRecord)
	return as.GetOwnedAffirmationsForUser(ctx, partnerId, *relationshipRecord)
}

func (as *AffirmationService) UpdateAffirmation(ctx context.Context, ownerId, relationshipId, affirmationId string, dto UpdateAffirmationDto) (*AffirmationRecord, error) {
	affirmation, err := as.GetAffirmationById(ctx, ownerId, relationshipId, affirmationId)

	if err != nil {
		return nil, err
	}

	if affirmation == nil {
		return nil, &models.ServiceError{
			StatusCode: http.StatusNotFound,
			Message:    "Affirmation not found!",
		}
	}

	var updateBody UpdateableAffirmationRecord
	if err := dynamo.TransformToUpdateable(dto, &updateBody); err != nil {
		return nil, err
	}

	keys := AffirmationKeys{}
	return dynamo.UpdateItem[AffirmationRecord](as.DynamoTable, dynamo.UpdateItemArgs{
		Ctx:        ctx,
		PK:         keys.PK(relationshipId),
		SK:         keys.SK(ownerId, affirmationId),
		UpdateBody: updateBody,
	})
}

func (as *AffirmationService) DeleteAffirmation(ctx context.Context, ownerId, relationshipId, affirmationId string) (*AffirmationRecord, error) {
	affirmation, err := as.GetAffirmationById(ctx, ownerId, relationshipId, affirmationId)

	if err != nil {
		return nil, err
	}

	if affirmation == nil {
		return nil, &models.ServiceError{
			StatusCode: http.StatusNotFound,
			Message:    "Affirmation not found",
		}
	}

	keys := AffirmationKeys{}
	_, err = dynamo.DeleteItem(as.DynamoTable, dynamo.DeleteItemArgs{
		Ctx: ctx,
		PK:  keys.PK(relationshipId),
		SK:  keys.SK(ownerId, affirmationId),
	})

	if err != nil {
		return nil, err
	}

	return affirmation, nil
}

func (as *AffirmationService) DeleteAffirmationsForRelationship(ctx context.Context, relationshipId string) ([]dynamodb.BatchWriteItemOutput, error) {
	keys := AffirmationKeys{}
	receivedAffirmationKeys := ReceivedAffirmationKeys{}

	relationshipAffirmations, err := dynamo.GetItems(
		as.DynamoTable,
		dynamo.GetItemsParams[AffirmationRecord]{
			QueryExpression: dynamo.DynamoQueryExpression{
				Expression: "#pk = :pk",
				Variables: map[string]any{
					":pk": keys.PK(relationshipId),
				},
			},
			Exhaustive: lo.ToPtr(true),
		},
	)

	if err != nil {
		return nil, err
	}

	receivedAffirmations, err := dynamo.GetItems(
		as.DynamoTable,
		dynamo.GetItemsParams[ReceivedAffirmationRecord]{
			QueryExpression: dynamo.DynamoQueryExpression{
				Expression: "#pk = :pk",
				Variables: map[string]any{
					":pk": receivedAffirmationKeys.PK(relationshipId),
				},
			},
			Exhaustive: lo.ToPtr(true),
		},
	)

	if err != nil {
		return nil, err
	}

	affirmationRecords := lo.Map(
		relationshipAffirmations.Data,
		func(affirmation AffirmationRecord, _ int) dynamo.DynamoRecord {
			return affirmation
		},
	)

	receivedRecords := lo.Map(
		receivedAffirmations.Data,
		func(affirmation ReceivedAffirmationRecord, _ int) dynamo.DynamoRecord {
			return affirmation
		},
	)

	combinedRecords := make([]dynamo.DynamoRecord, 0)
	combinedRecords = append(combinedRecords, affirmationRecords...)
	combinedRecords = append(combinedRecords, receivedRecords...)

	args := lo.Map(
		combinedRecords,
		func(record dynamo.DynamoRecord, _ int) dynamo.BatchWriteItemsArgs {
			return dynamo.BatchWriteItemsArgs{
				Delete: &dynamo.WriteDeleteArgs{
					PK: record.GetPK(),
					SK: record.GetSK(),
				},
			}
		},
	)

	return dynamo.BatchWriteItems(
		as.DynamoTable,
		ctx,
		args...,
	), nil
}

func (as *AffirmationService) CreateReceivedAffirmation(ctx context.Context, receiver, relationshipId, affirmation string) (*ReceivedAffirmationRecord, error) {
	timestamp, keys := time.Now(), ReceivedAffirmationKeys{}
	return dynamo.PutItem(
		as.DynamoTable,
		dynamo.PutItemArgs[ReceivedAffirmationRecord]{
			Ctx: ctx,
			Item: ReceivedAffirmationRecord{
				DynamoPrimaryKey: dynamo.DynamoPrimaryKey{
					PK: keys.PK(relationshipId),
					SK: keys.SK(receiver, timestamp),
				},
				DynamoEntityType: dynamo.DynamoEntityType{
					EntityType: EntityTypeReceivedAffirmation,
				},
				Affirmation: affirmation,
				Timestamp:   timestamp,
			},
		},
	)
}

func (as *AffirmationService) GetReceivedAffirmations(ctx context.Context, userId, relationshipId string, dto GetReceivedAffirmationsDto) (*dynamo.InfiniteData[ReceivedAffirmationRecord], error) {
	keys := ReceivedAffirmationKeys{}
	return dynamo.GetItems(
		as.DynamoTable,
		dynamo.GetItemsParams[ReceivedAffirmationRecord]{
			Ctx: ctx,
			QueryExpression: dynamo.DynamoQueryExpression{
				Expression: "#pk = :pk AND begins_with(#sk, :sk)",
				Variables: map[string]any{
					":pk": keys.PK(relationshipId),
					":sk": keys.BuildKey(userId),
				},
			},
			Limit:  lo.ToPtr(dto.GetLimit()),
			Cursor: dto.GetCursor(),
			Order:  lo.ToPtr(dto.GetOrder()),
		},
	)
}

func (as *AffirmationService) GetTodaysReceivedAffirmations(ctx context.Context, userId, relationshipId string) ([]ReceivedAffirmationRecord, error) {
	today, keys := strings.Split(time.Now().Format(time.RFC3339), "T")[0], ReceivedAffirmationKeys{}
	data, err := dynamo.GetItems(
		as.DynamoTable,
		dynamo.GetItemsParams[ReceivedAffirmationRecord]{
			Ctx: ctx,
			QueryExpression: dynamo.DynamoQueryExpression{
				Expression: "#pk = :pk AND begins_with(#sk, :sk)",
				Variables: map[string]any{
					":pk": keys.PK(relationshipId),
					":sk": keys.BuildKey(userId, today),
				},
			},
			Exhaustive: lo.ToPtr(true),
		},
	)

	if err != nil {
		return nil, err
	}

	return data.Data, nil
}

type SendAffirmationToUserOpts struct {
	Partner *user.UserRecord
}

func (as *AffirmationService) SendAffirmationToUser(
	ctx context.Context,
	userRecord user.UserRecord,
	dto SendCustomAffirmationDto,
	opts ...SendAffirmationToUserOpts,
) (bool, error) {
	if userRecord.RelationshipId == "" {
		return false, &models.ServiceError{
			StatusCode: http.StatusBadRequest,
			Message:    "You aren't in a relationship!",
		}
	}

	var partner *user.UserRecord
	if len(opts) > 0 && opts[0].Partner != nil {
		partner = opts[0].Partner
	} else {
		p, err := as.RelationshipService.GetPartnerForUser(ctx, userRecord.Id)
		if err != nil {
			return false, err
		}

		if p == nil {
			return false, &models.ServiceError{
				StatusCode: http.StatusBadRequest,
				Message:    "You aren't in a relationship!",
			}
		}

		partner = p
	}

	err := as.WebsocketService.OpenConnection()

	if err != nil {
		return false, err
	}

	defer as.WebsocketService.CloseConnection()

	return as.NotificationService.SendNotification(
		ctx,
		notification.SendNotificationArgs{
			User: userRecord,
			Payload: notification.NotificationPayload{
				Title:   fmt.Sprintf("%s says", partner.FirstName),
				Body:    dto.Affirmation,
				OpenUrl: lo.ToPtr("/affirmations"),
			},
		},
		notification.SendNotificationOpts{
			OnlineWebSocketMessage: &notification.OnlineWebSocketMessageArgs{
				MqttConnection: *as.WebsocketService,
				Topic:          fmt.Sprintf("%s/%s/notifications", os.Getenv("NOTIFICATIONS_TOPIC"), userRecord.Id),
			},
			OnSuccess: func() {
				_, err := as.CreateReceivedAffirmation(ctx, userRecord.Id, userRecord.RelationshipId, dto.Affirmation)
				as.Logger.Println(fmt.Errorf("there was an error attempting to create the received affirmation record for a custom affirmation: %w", err))
			},
		},
	)
}
