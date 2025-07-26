package affirmation

import (
	"context"
	"crypto/rand"
	"encoding/binary"
	"log"
	"lumi/pkg/dynamo"
	"lumi/pkg/models"
	"lumi/pkg/models/relationship"
	"lumi/pkg/models/user"
	"lumi/pkg/utils"
	"math"
	"net/http"
	"os"

	"github.com/samber/lo"
	"github.com/samber/lo/mutable"
)

type AffirmationService struct {
	DynamoTable         *dynamo.DynamoTable
	RelationshipService *relationship.RelationshipService
	Logger              *log.Logger
}

type AffirmationServiceArgs struct {
	DynamoTable         *dynamo.DynamoTable
	RelationshipService *relationship.RelationshipService
}

func NewAffirmationService(args AffirmationServiceArgs) *AffirmationService {
	dynamoTable, relationshipService := args.DynamoTable, args.RelationshipService

	if dynamoTable == nil {
		panic("DynamoTable is required for the AffirmationService")
	}

	if relationshipService == nil {
		relationshipService = relationship.NewRelationshipService(relationship.RelationshipServiceArgs{
			DynamoTable: dynamoTable,
			UserService: user.NewUserService(dynamoTable, nil),
		})
	}

	logger := log.New(os.Stdout, "affirmation-service: ", log.LstdFlags)
	return &AffirmationService{
		DynamoTable:         dynamoTable,
		RelationshipService: relationshipService,
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
