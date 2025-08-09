package songrecommendation

import (
	"context"
	"log"
	"lumi/pkg/dynamo"
	"lumi/pkg/models"
	"lumi/pkg/utils"
	"net/http"
	"os"
	"time"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/samber/lo"
)

type SongRecommendationService struct {
	DynamoTable *dynamo.DynamoTable
	Logger      *log.Logger
}

func NewSongRecommendationService(dynamoTable *dynamo.DynamoTable) *SongRecommendationService {
	logger := log.New(os.Stdout, "song-rec-service: ", log.LstdFlags)
	return &SongRecommendationService{
		DynamoTable: dynamoTable,
		Logger:      logger,
	}
}

func (srs *SongRecommendationService) GetSongRecommendationByTrackIdForUser(ctx context.Context, userId, trackId string) (*SongRecommendationRecord, error) {
	keys := SongRecommendationKeys{}
	res, err := dynamo.GetItems(srs.DynamoTable, dynamo.GetItemsParams[SongRecommendationRecord]{
		Ctx:   ctx,
		Index: lo.ToPtr(dynamo.GSI2),
		QueryExpression: dynamo.DynamoQueryExpression{
			Expression: "#gsi2pk = :gsi2pk and #gsi2sk = :gsi2sk",
			Variables: map[string]any{
				":gsi2pk": keys.GSI2PK(userId),
				":gsi2sk": keys.GSI2SK(trackId),
			},
		},
	})

	if err != nil {
		return nil, err
	} else if len(res.Data) == 0 {
		return nil, err
	} else {
		return &res.Data[0], nil
	}
}

func (srs *SongRecommendationService) CreateSongRecommendation(ctx context.Context, recommenderId, relationshipId string, dto CreateSongRecommendationDto) (*SongRecommendationRecord, error) {
	existingRecommendation, err := srs.GetSongRecommendationByTrackIdForUser(ctx, recommenderId, dto.Name)

	if err != nil {
		return nil, err
	}

	if existingRecommendation != nil {
		return nil, &models.ServiceError{
			StatusCode: http.StatusBadRequest,
			Message:    "You have already sent this song recommendation!",
		}
	}

	recId, createdAt := utils.GetUUID(), time.Now()
	keys := SongRecommendationKeys{}
	return dynamo.PutItem(
		srs.DynamoTable,
		dynamo.PutItemArgs[SongRecommendationRecord]{
			Ctx: ctx,
			Item: SongRecommendationRecord{
				DynamoPrimaryKey: dynamo.DynamoPrimaryKey{
					PK: keys.PK(recId),
					SK: keys.SK(recId),
				},
				DynamoGSI1Keys: dynamo.DynamoGSI1Keys{
					GSI1PK: keys.GSI1PK(relationshipId),
					GSI1SK: keys.GSI1SK(recommenderId, false, createdAt),
				},
				DynamoGSI2Keys: dynamo.DynamoGSI2Keys{
					GSI2PK: keys.GSI2PK(recommenderId),
					GSI2SK: keys.GSI2SK(dto.Id),
				},
				DynamoEntityType: dynamo.DynamoEntityType{
					EntityType: EntityTypeSongRecommendation,
				},
				Id:             recId,
				Listened:       false,
				RelationshipId: relationshipId,
				RecommenderId:  recommenderId,
				Track: RecommendedSpotifyTrack{
					Id:         dto.Id,
					Uri:        dto.Uri,
					Name:       dto.Name,
					AlbumImage: dto.AlbumImage,
					ArtistName: dto.ArtistName,
					Duration:   dto.Duration,
				},
				CreatedAt: createdAt,
			},
		},
	)
}

func (srs *SongRecommendationService) GetSongRecommendations(ctx context.Context, partnerId, relationshipId string, dto GetSongRecommendationsDto) (*dynamo.InfiniteData[SongRecommendationRecord], error) {
	keys := SongRecommendationKeys{}
	return dynamo.GetItems(srs.DynamoTable, dynamo.GetItemsParams[SongRecommendationRecord]{
		Ctx:   ctx,
		Index: lo.ToPtr(dynamo.GSI1),
		QueryExpression: dynamo.DynamoQueryExpression{
			Expression: "#gsi1pk = :gsi1pk and begins_with(#gsi1sk, :gsi1sk)",
			Variables: map[string]any{
				":gsi1pk": keys.GSI1PK(relationshipId),
				":gsi1sk": keys.BuildKey(
					partnerId,
					lo.TernaryF(
						dto.Filter != nil,
						func() string { return string(*dto.Filter) },
						func() string { return "" },
					),
				),
			},
		},
		Limit:  dto.Limit,
		Cursor: dto.Cursor,
		Order:  dto.Order,
	})
}

func (srs *SongRecommendationService) GetSongRecommendationsByRelationshipId(ctx context.Context, relationshipId string, dto GetSongRecommendationsDto) (*dynamo.InfiniteData[SongRecommendationRecord], error) {
	keys := SongRecommendationKeys{}
	return dynamo.GetItems(srs.DynamoTable, dynamo.GetItemsParams[SongRecommendationRecord]{
		Ctx:   ctx,
		Index: lo.ToPtr(dynamo.GSI3),
		QueryExpression: dynamo.DynamoQueryExpression{
			Expression: "#gsi3pk = :gsi3pk and begins_with(#gsi3sk, :gsi3sk)",
			Variables: map[string]any{
				":gsi3pk": keys.GSI3PK(relationshipId),
				":gsi3sk": keys.BuildKey(relationshipId),
			},
		},
		Limit:  dto.Limit,
		Cursor: dto.Cursor,
		Order:  dto.Order,
	})
}

func (srs *SongRecommendationService) GetSongRecommendationById(ctx context.Context, recId string) (*SongRecommendationRecord, error) {
	keys := SongRecommendationKeys{}
	return dynamo.GetItem[SongRecommendationRecord](srs.DynamoTable, dynamo.GetItemArgs{
		Ctx: ctx,
		PK:  keys.PK(recId),
		SK:  keys.SK(recId),
	})
}

func (srs *SongRecommendationService) UpdateSongRecommendation(ctx context.Context, recommendationId string, dto UpdateSongRecommendationDto) (*SongRecommendationRecord, error) {
	existingRecommendation, err := srs.GetSongRecommendationById(ctx, recommendationId)

	if err != nil {
		return nil, err
	}

	if existingRecommendation == nil {
		return nil, &models.ServiceError{
			StatusCode: http.StatusNotFound,
			Message:    "Song recommendation not found!",
		}
	}

	var updateBody UpdateableSongRecommendation
	if err := dynamo.TransformToUpdateable(dto, &updateBody); err != nil {
		return nil, err
	}

	keys := SongRecommendationKeys{}
	updateTime := time.Now()

	if dto.Listened != nil {
		updateBody.GSI1SK = dynamo.NewUpdateValue(keys.GSI1SK(existingRecommendation.RecommenderId, *dto.Listened, existingRecommendation.CreatedAt))
	}

	updateBody.GSI3PK = dynamo.NewUpdateValue(keys.GSI3PK(existingRecommendation.RelationshipId))
	updateBody.GSI3SK = dynamo.NewUpdateValue(keys.GSI3SK(existingRecommendation.RelationshipId, updateTime))
	updateBody.UpdatedAt = lo.ToPtr(dynamo.NewUpdateValue(updateTime))

	return dynamo.UpdateItem[SongRecommendationRecord](srs.DynamoTable, dynamo.UpdateItemArgs{
		Ctx:        ctx,
		PK:         keys.PK(recommendationId),
		SK:         keys.SK(recommendationId),
		UpdateBody: updateBody,
	})
}

func (srs *SongRecommendationService) DeleteSongRecommendation(ctx context.Context, recommendationId string) (*SongRecommendationRecord, error) {
	existingRecommendation, err := srs.GetSongRecommendationById(ctx, recommendationId)

	if err != nil {
		return nil, err
	}

	if existingRecommendation == nil {
		return nil, &models.ServiceError{
			StatusCode: http.StatusNotFound,
			Message:    "Song recommendation not found!",
		}
	}

	keys := SongRecommendationKeys{}
	dynamo.DeleteItem(srs.DynamoTable, dynamo.DeleteItemArgs{
		Ctx: ctx,
		PK:  keys.PK(recommendationId),
		SK:  keys.SK(recommendationId),
	})

	return existingRecommendation, nil
}

func (srs *SongRecommendationService) DeleteSongRecommendationsByRelationshipId(ctx context.Context, relationshipId string) ([]dynamodb.BatchWriteItemOutput, error) {
	keys := SongRecommendationKeys{}
	songRecs, err := dynamo.GetItems(srs.DynamoTable, dynamo.GetItemsParams[SongRecommendationRecord]{
		Ctx:   ctx,
		Index: lo.ToPtr(dynamo.GSI1),
		QueryExpression: dynamo.DynamoQueryExpression{
			Expression: "#gsi1pk = :gsi1pk",
			Variables: map[string]any{
				":gsi1pk": keys.GSI1PK(relationshipId),
			},
		},
	})

	if err != nil {
		return nil, err
	}

	args := lo.Map(songRecs.Data, func(rec SongRecommendationRecord, _ int) dynamo.BatchWriteItemsArgs {
		return dynamo.BatchWriteItemsArgs{
			Delete: &dynamo.WriteDeleteArgs{
				PK: keys.PK(rec.Id),
				SK: keys.SK(rec.Id),
			},
		}
	})
	return dynamo.BatchWriteItems(srs.DynamoTable, ctx, args...), nil
}
