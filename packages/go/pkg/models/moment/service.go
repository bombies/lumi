package moment

import (
	"context"
	"fmt"
	"log"
	"lumi/pkg/dynamo"
	"lumi/pkg/models"
	"lumi/pkg/s3"
	"lumi/pkg/utils"
	"maps"
	"mime"
	"net/http"
	"os"
	"slices"
	"time"

	v4 "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/redis/go-redis/v9"
	"github.com/samber/lo"
)

type MomentService struct {
	DynamoTable *dynamo.DynamoTable
	S3Bucket    s3.BucketAPI
	RedisClient *redis.Client
	Logger      *log.Logger
}

type MomentServiceArgs struct {
	DynamoTable   *dynamo.DynamoTable
	RedisClient   *redis.Client
	StorageBucket s3.BucketAPI
}

func NewMomentService(args MomentServiceArgs) *MomentService {
	logger := log.New(os.Stdout, "moment-service: ", log.LstdFlags)
	return &MomentService{
		DynamoTable: args.DynamoTable,
		S3Bucket:    args.StorageBucket,
		RedisClient: args.RedisClient,
		Logger:      logger,
	}
}

func (ms *MomentService) CreateMomentDetails(ctx context.Context, userId, relationshipId string, dto CreateMomentDetailsDto) (*MomentRecord, error) {
	id, timestamp := utils.GetUUID(), time.Now()
	keys := MomentKeys{}

	momentDetails, err := dynamo.PutItem(
		ms.DynamoTable,
		dynamo.PutItemArgs[MomentRecord]{
			Ctx: ctx,
			Item: MomentRecord{
				DynamoPrimaryKey: dynamo.DynamoPrimaryKey{
					PK: keys.PK(id),
					SK: keys.SK(id),
				},
				DynamoGSI1Keys: dynamo.DynamoGSI1Keys{
					GSI1PK: keys.GSI1PK(relationshipId),
					GSI1SK: keys.GSI1SK(timestamp),
				},
				DynamoGSI2Keys: dynamo.DynamoGSI2Keys{
					GSI2PK: keys.GSI2PK(userId),
					GSI2SK: keys.GSI2SK(timestamp),
				},
				DynamoEntityType: dynamo.DynamoEntityType{
					EntityType: EntityTypeMomentDetails,
				},
				Id:                 id,
				RelationshipId:     relationshipId,
				UserId:             userId,
				Title:              cleanMomentTitle(dto.Title),
				NormalizedTitle:    cleanMomentTitle(dto.Title),
				ObjectKey:          dto.ObjectKey,
				ThumbnailObjectKey: dto.ThumbnailObjectKey,
				Description:        dto.Description,
				CreatedAt:          timestamp,
			},
		},
	)

	if err != nil {
		return nil, err
	}

	if tags := dto.Tags; len(tags) > 0 {
		tagsCreationResult := utils.FanOut(utils.FanOutArgs[string, MomentTagRecord]{
			Items:       tags,
			WorkerCount: len(tags),
			WorkerCallback: func(workerId int, jobs <-chan string, results chan<- utils.FanOutJobResult[MomentTagRecord]) {
				for tag := range jobs {
					tagRecord, err := ms.CreateMomentTag(ctx, userId, relationshipId, id, CreateMomentTagDto{
						Tag: tag,
					})

					if err != nil {
						results <- utils.FanOutJobResult[MomentTagRecord]{
							Err: err,
						}
						continue
					}

					results <- utils.FanOutJobResult[MomentTagRecord]{
						JobResult: tagRecord,
					}
				}
			},
		})

		if errs := tagsCreationResult.Errors; len(errs) > 0 {
			ms.Logger.Printf("[ERROR] There were some errors creating tags for moment with ID %s\n", id)
			for _, err := range errs {
				ms.Logger.Println(fmt.Errorf("\t%w\n", err.Err))
			}
		}
	}

	attachUrlsToMoment(ctx, AttachUrlsToMomentArgs{
		Moment:      momentDetails,
		RedisClient: ms.RedisClient,
	})

	return momentDetails, nil
}

type GetMomentDetailsByIdOptions struct {
	NilError *bool
}

func (ms *MomentService) GetMomentDetailsById(ctx context.Context, id string, opts ...GetMomentDetailsByIdOptions) (*MomentRecord, error) {
	keys := MomentKeys{}
	res, err := dynamo.GetItem[MomentRecord](
		ms.DynamoTable,
		dynamo.GetItemArgs{
			Ctx: ctx,
			PK:  keys.PK(id),
			SK:  keys.SK(id),
		},
	)

	if err != nil {
		return nil, err
	}

	if res == nil && len(opts) > 0 && opts[0].NilError != nil && *opts[0].NilError {
		return nil, &models.ServiceError{
			StatusCode: http.StatusNotFound,
			Message:    "Moment details not found",
		}
	}

	attachUrlsToMoment(
		ctx,
		AttachUrlsToMomentArgs{
			Moment:      res,
			RedisClient: ms.RedisClient,
		},
	)

	return res, nil
}

func (ms *MomentService) GetMomentsForRelationship(ctx context.Context, relationshipId string, dto GetInfiniteMomentsDto) (*dynamo.InfiniteData[MomentRecord], error) {
	keys := MomentKeys{}
	return dynamo.GetItems(
		ms.DynamoTable,
		dynamo.GetItemsParams[MomentRecord]{
			Ctx:   ctx,
			Index: lo.ToPtr(dynamo.GSI1),
			QueryExpression: dynamo.DynamoQueryExpression{
				Expression: "#gsi1pk = :gsi1pk",
				Variables: map[string]any{
					":gsi1pk": keys.GSI1PK(relationshipId),
				},
			},
			Cursor: dto.Cursor,
			Order:  lo.ToPtr(dto.GetOrder()),
			Limit:  lo.ToPtr(dto.GetLimit()),
			Mapper: func(mr MomentRecord) MomentRecord {
				attachUrlsToMoment(
					ctx,
					AttachUrlsToMomentArgs{
						Moment:      &mr,
						RedisClient: ms.RedisClient,
					},
				)
				return mr
			},
		},
	)
}

func (ms *MomentService) GetMomentsForUser(ctx context.Context, userId string, dto GetInfiniteMomentsDto) (*dynamo.InfiniteData[MomentRecord], error) {
	keys := MomentKeys{}
	return dynamo.GetItems(
		ms.DynamoTable,
		dynamo.GetItemsParams[MomentRecord]{
			Ctx:   ctx,
			Index: lo.ToPtr(dynamo.GSI2),
			QueryExpression: dynamo.DynamoQueryExpression{
				Expression: "#gsi2pk = :gsi2pk",
				Variables: map[string]any{
					":gsi2pk": keys.GSI2PK(userId),
				},
			},
			Cursor: dto.GetCursor(),
			Order:  lo.ToPtr(dto.GetOrder()),
			Limit:  lo.ToPtr(dto.GetLimit()),
			Mapper: func(mr MomentRecord) MomentRecord {
				attachUrlsToMoment(
					ctx,
					AttachUrlsToMomentArgs{
						Moment:      &mr,
						RedisClient: ms.RedisClient,
					},
				)
				return mr
			},
		},
	)
}

func (ms *MomentService) SearchMoments(ctx context.Context, relationshipId string, dto SearchMomentsDto) (*dynamo.InfiniteDataTupledCursor[MomentRecord], error) {
	keys := MomentKeys{}
	moments, err := dynamo.GetItems(
		ms.DynamoTable,
		dynamo.GetItemsParams[MomentRecord]{
			Ctx:   ctx,
			Index: lo.ToPtr(dynamo.GSI1),
			QueryExpression: dynamo.DynamoQueryExpression{
				Expression: "#gsi1pk = :gsi1pk",
				Variables: map[string]any{
					":gsi1pk": keys.GSI1PK(relationshipId),
				},
				Filter: &dynamo.DynamoQueryFilterExpression{
					Expression: "contains(#normalizedTitle, :normalizedTitle)",
					Variables: map[string]any{
						":normalizedTitle": normalizeMomentTitle(dto.Query),
					},
				},
			},
			Limit:  lo.ToPtr(dto.GetLimit()),
			Cursor: dto.Cursor[0],
			Order:  lo.ToPtr(dto.GetOrder()),
			Mapper: func(mr MomentRecord) MomentRecord {
				attachUrlsToMoment(
					ctx,
					AttachUrlsToMomentArgs{
						Moment:      &mr,
						RedisClient: ms.RedisClient,
					},
				)
				return mr
			},
		},
	)

	if err != nil {
		return nil, err
	}

	tagMoments, err := ms.GetMomentsByTag(
		ctx,
		relationshipId,
		GetMomentsByTagDto{
			TagQuery: dto.Query,
			Limit:    lo.ToPtr(dto.GetLimit()),
			Order:    lo.ToPtr(dto.GetOrder()),
			Cursor:   dto.Cursor[1],
		},
	)

	if err != nil {
		return nil, err
	}

	// De-duplicate moments
	momentMap := make(map[string]MomentRecord)
	for _, moment := range moments.Data {
		momentMap[moment.Id] = moment
	}

	for _, moment := range tagMoments.Data {
		_, exists := momentMap[moment.Id]

		if !exists {
			momentMap[moment.Id] = moment
		}
	}

	momentSet := slices.Collect(maps.Values(momentMap))
	slices.SortFunc(
		momentSet,
		func(a MomentRecord, b MomentRecord) int {
			return lo.Ternary(
				dto.GetOrder() != dynamo.AscendingQueryOrder,
				a.CreatedAt.Compare(b.CreatedAt),
				b.CreatedAt.Compare(a.CreatedAt),
			)
		},
	)

	return &dynamo.InfiniteDataTupledCursor[MomentRecord]{
		Data:       momentSet,
		NextCursor: [2]map[string]types.AttributeValue{moments.NextCursor, tagMoments.NextCursor},
	}, nil
}

func (ms *MomentService) UpdateMomentDetails(ctx context.Context, momentId string, dto UpdateMomentDetailsDto) (*MomentRecord, error) {
	momentKeys := MomentKeys{}
	var udpdateBody UpdateableMomentRecord

	if err := dynamo.TransformToUpdateable(dto, &udpdateBody); err != nil {
		return nil, err
	}

	if dto.Title != nil {
		udpdateBody.NormalizedTitle = lo.ToPtr(dynamo.NewUpdateValue(normalizeMomentTitle(*dto.Title)))
	}

	updatedMoment, err := dynamo.UpdateItem[MomentRecord](
		ms.DynamoTable,
		dynamo.UpdateItemArgs{
			Ctx:        ctx,
			PK:         momentKeys.PK(momentId),
			SK:         momentKeys.SK(momentId),
			UpdateBody: udpdateBody,
		},
	)

	if err != nil {
		return nil, err
	}

	tags := lo.Map(dto.Tags, func(tag string, _ int) string {
		return normalizeMomentTag(tag)
	})
	existingTags, err := ms.GetTagsForMoment(ctx, momentId)

	if err != nil {
		return nil, err
	}

	existingTagNames := lo.Map(existingTags, func(tag MomentTagRecord, _ int) string {
		return tag.Tag
	})

	newTags := lo.Filter(tags, func(tag string, _ int) bool {
		return !slices.Contains(existingTagNames, tag)
	})

	removedTags := lo.Ternary(
		len(tags) > 0,
		lo.Filter(existingTags, func(tag MomentTagRecord, _ int) bool {
			return !slices.Contains(tags, tag.Tag)
		}),
		[]MomentTagRecord{},
	)

	if len(newTags) > 0 {
		createdAt, tagKeys := time.Now(), MomentTagKeys{}
		args := lo.Map(newTags, func(tag string, _ int) dynamo.BatchWriteItemsArgs {
			return dynamo.BatchWriteItemsArgs{
				Put: &dynamo.WritePutArgs{
					Item: MomentTagRecord{
						DynamoPrimaryKey: dynamo.DynamoPrimaryKey{
							PK: tagKeys.PK(momentId),
							SK: tagKeys.SK(tag),
						},
						DynamoGSI1Keys: dynamo.DynamoGSI1Keys{
							GSI1PK: tagKeys.GSI1PK(updatedMoment.RelationshipId),
							GSI1SK: tagKeys.GSI1SK(tag),
						},
						DynamoEntityType: dynamo.DynamoEntityType{
							EntityType: EntityTypeMomentTag,
						},
						Tag:            tag,
						MomentId:       momentId,
						TaggerId:       updatedMoment.UserId,
						RelationshipId: updatedMoment.RelationshipId,
						CreatedAt:      createdAt,
					},
				},
			}
		})

		dynamo.BatchWriteItems(
			ms.DynamoTable,
			ctx,
			args...,
		)
	}

	if len(removedTags) > 0 {
		tagKeys := MomentTagKeys{}
		dynamo.DeleteManyItems(
			ms.DynamoTable,
			ctx,
			lo.Map(removedTags, func(tag MomentTagRecord, _ int) dynamo.DynamoPrimaryKey {
				return dynamo.DynamoPrimaryKey{
					PK: tagKeys.PK(momentId),
					SK: tagKeys.SK(tag.Tag),
				}
			}),
		)
	}

	err = attachUrlsToMoment(ctx, AttachUrlsToMomentArgs{
		Moment:      updatedMoment,
		RedisClient: ms.RedisClient,
	})

	if err != nil {
		return nil, err
	}

	return updatedMoment, nil
}

func (ms *MomentService) DeleteMomentDetails(ctx context.Context, momentId string) (bool, error) {
	keys := MomentKeys{}
	return dynamo.DeleteItem(ms.DynamoTable, dynamo.DeleteItemArgs{
		Ctx: ctx,
		PK:  keys.PK(momentId),
		SK:  keys.SK(momentId),
	})
}

func (ms *MomentService) CreateMomentMessage(ctx context.Context, userId string, momentId string, dto CreateMomentMessageDto) (*MomentMessageRecord, error) {
	id := lo.TernaryF(dto.Id != nil, func() string { return *dto.Id }, func() string { return utils.GetUUID() })
	timestamp, keys := lo.TernaryF(
		dto.Timestamp != nil,
		func() time.Time {
			timestamp := *dto.Timestamp
			timeStruct, err := time.Parse(time.RFC3339, timestamp)
			if err != nil {
				ms.Logger.Printf("Error parsing timestamp: %v", err)
				return time.Now()
			}
			return timeStruct
		},
		func() time.Time {
			return time.Now()
		},
	), MomentMessageKeys{}

	return dynamo.PutItem(ms.DynamoTable, dynamo.PutItemArgs[MomentMessageRecord]{
		Ctx: ctx,
		Item: MomentMessageRecord{
			DynamoPrimaryKey: dynamo.DynamoPrimaryKey{
				PK: keys.PK(id),
				SK: keys.SK(id),
			},
			DynamoGSI1Keys: dynamo.DynamoGSI1Keys{
				GSI1PK: keys.GSI1PK(momentId),
				GSI1SK: keys.GSI1SK(timestamp),
			},
			DynamoEntityType: dynamo.DynamoEntityType{
				EntityType: EntityTypeMomentMessage,
			},
			Id:        id,
			SenderId:  userId,
			MomentId:  momentId,
			Content:   dto.Content,
			RepliedTo: dto.RepliedTo,
			State:     lo.ToPtr(MomentMessageStateDelivered),
			Timestamp: timestamp,
		},
	})
}

func (ms *MomentService) GetMomentMessageById(ctx context.Context, messageId string) (*MomentMessageRecord, error) {
	return dynamo.GetItem[MomentMessageRecord](ms.DynamoTable, dynamo.GetItemArgs{
		Ctx: ctx,
		PK:  MomentMessageKeys{}.PK(messageId),
		SK:  MomentMessageKeys{}.SK(messageId),
	})
}

func (ms *MomentService) GetMessagesForMoment(ctx context.Context, momentId string, dto GetInfiniteMomentMessagesDto) (*dynamo.InfiniteData[MomentMessageRecord], error) {
	keys := MomentMessageKeys{}
	return dynamo.GetItems(ms.DynamoTable, dynamo.GetItemsParams[MomentMessageRecord]{
		Ctx:   ctx,
		Index: lo.ToPtr(dynamo.GSI1),
		QueryExpression: dynamo.DynamoQueryExpression{
			Expression: "#gsi1pk = :gsi1pk",
			Variables: map[string]any{
				":gsi1pk": keys.GSI1PK(momentId),
			},
		},
		Cursor: dto.Cursor,
		Order:  dto.Order,
		Limit:  dto.Limit,
	})
}

func (ms *MomentService) UpdateMomentMessage(ctx context.Context, messageId string, dto UpdateMomentMessageDto) (*MomentMessageRecord, error) {
	var updateBody UpdateableMomentMessageRecord
	if err := dynamo.TransformToUpdateable(dto, &updateBody); err != nil {
		return nil, err
	}

	if dto.Content != nil {
		updateBody.UpdatedAt = lo.ToPtr(dynamo.NewUpdateValue(time.Now()))
	}

	keys := MomentMessageKeys{}
	return dynamo.UpdateItem[MomentMessageRecord](ms.DynamoTable, dynamo.UpdateItemArgs{
		Ctx:        ctx,
		PK:         keys.PK(messageId),
		SK:         keys.SK(messageId),
		UpdateBody: updateBody,
	})

}

func (ms *MomentService) DeleteMomentMessage(ctx context.Context, messageId string) (*MomentMessageRecord, error) {
	keys := MomentMessageKeys{}
	return dynamo.UpdateItem[MomentMessageRecord](ms.DynamoTable, dynamo.UpdateItemArgs{
		Ctx: ctx,
		PK:  keys.PK(messageId),
		SK:  keys.SK(messageId),
		UpdateBody: UpdateableMomentMessageRecord{
			Content:   lo.ToPtr(dynamo.NewUpdateValue("This message has been deleted.")),
			IsDeleted: lo.ToPtr(dynamo.NewUpdateValue(true)),
		},
	})
}

func (ms *MomentService) HardDeleteMomentMessage(ctx context.Context, messageId string) (bool, error) {
	keys := MomentMessageKeys{}
	return dynamo.DeleteItem(ms.DynamoTable, dynamo.DeleteItemArgs{
		PK: keys.PK(messageId),
		SK: keys.SK(messageId),
	})
}

func (ms *MomentService) DeleteMomentDetailsForRelationship(ctx context.Context, relationshipId string) ([]dynamodb.BatchWriteItemOutput, error) {
	momentKeys := MomentKeys{}
	momentDetails, err := dynamo.GetItems(ms.DynamoTable, dynamo.GetItemsParams[MomentRecord]{
		Ctx:   ctx,
		Index: lo.ToPtr(dynamo.GSI1),
		QueryExpression: dynamo.DynamoQueryExpression{
			Expression: "#gsi1pk = :gsi1pk",
			Variables: map[string]any{
				":gsi1pk": momentKeys.GSI1PK(relationshipId),
			},
		},
		Exhaustive: lo.ToPtr(true),
	})

	if err != nil {
		return nil, err
	}

	relationshipMomentTagKeys := RelationshipMomentTagKeys{}
	relationshipMomentTags, err := dynamo.GetItems(ms.DynamoTable, dynamo.GetItemsParams[RelationshipMomentTagRecord]{
		Ctx: ctx,
		QueryExpression: dynamo.DynamoQueryExpression{
			Expression: "#pk = :pk",
			Variables: map[string]any{
				":pk": relationshipMomentTagKeys.PK(relationshipId),
			},
		},
		Exhaustive: lo.ToPtr(true),
	})

	if err != nil {
		return nil, err
	}

	outputs := make([]dynamodb.BatchWriteItemOutput, 0)
	if len(relationshipMomentTags.Data) > 0 {
		res := dynamo.DeleteManyItems(ms.DynamoTable, ctx, lo.Map(
			relationshipMomentTags.Data,
			func(tag RelationshipMomentTagRecord, _ int) dynamo.DynamoPrimaryKey {
				return dynamo.DynamoPrimaryKey{
					PK: tag.PK,
					SK: tag.SK,
				}
			},
		))
		outputs = append(outputs, res...)
	}

	res := dynamo.DeleteManyItems(ms.DynamoTable, ctx, lo.Map(
		momentDetails.Data,
		func(moment MomentRecord, _ int) dynamo.DynamoPrimaryKey {
			return dynamo.DynamoPrimaryKey{
				PK: moment.PK,
				SK: moment.SK,
			}
		},
	))

	outputs = append(outputs, res...)
	return outputs, nil
}

func (ms *MomentService) GetRelationshipMomentTag(ctx context.Context, relationshipId, tag string) (*RelationshipMomentTagRecord, error) {
	keys := RelationshipMomentTagKeys{}
	return dynamo.GetItem[RelationshipMomentTagRecord](ms.DynamoTable, dynamo.GetItemArgs{
		Ctx: ctx,
		PK:  keys.PK(relationshipId),
		SK:  keys.SK(tag),
	})
}

func (ms *MomentService) GetRelationshipMomentTags(ctx context.Context, relationshipId string, dto GetRelationshipMomentTagsDto) (*dynamo.InfiniteData[RelationshipMomentTagRecord], error) {
	keys := RelationshipMomentTagKeys{}
	variables := map[string]any{
		":pk": keys.PK(relationshipId),
	}

	if dto.Query != "" {
		variables[":sk"] = keys.SK(normalizeMomentTag(dto.Query))
	}

	return dynamo.GetItems(ms.DynamoTable, dynamo.GetItemsParams[RelationshipMomentTagRecord]{
		Ctx: ctx,
		QueryExpression: dynamo.DynamoQueryExpression{
			Expression: fmt.Sprintf("#pk = :pk%s", lo.Ternary(dto.Query != "", " AND begins_with(#sk)", "")),
			Variables:  variables,
		},
		Cursor: dto.GetCursor(),
		Limit:  lo.ToPtr(dto.GetLimit()),
		Order:  lo.ToPtr(dynamo.AscendingQueryOrder),
	})
}

func (ms *MomentService) GetMomentTagsForRelationshipTag(ctx context.Context, relationshipId, tag string) ([]MomentTagRecord, error) {
	keys := MomentTagKeys{}
	res, err := dynamo.GetItems(ms.DynamoTable, dynamo.GetItemsParams[MomentTagRecord]{
		Ctx:   ctx,
		Index: lo.ToPtr(dynamo.GSI1),
		QueryExpression: dynamo.DynamoQueryExpression{
			Expression: "#gsi1pk = :gsi1pk AND #gsi1sk = :gsi1sk",
			Variables: map[string]any{
				":gsi1pk": keys.GSI1PK(relationshipId),
				":gsi1sk": normalizeMomentTag(tag),
			},
		},
		Exhaustive: lo.ToPtr(true),
	})

	if err != nil {
		return nil, err
	}

	return res.Data, nil
}

func (ms *MomentService) DeleteRelationshipMomentTag(ctx context.Context, relationshipId, tag string) (bool, error) {
	keys := RelationshipMomentTagKeys{}
	return dynamo.DeleteItem(ms.DynamoTable, dynamo.DeleteItemArgs{
		Ctx: ctx,
		PK:  keys.PK(relationshipId),
		SK:  keys.SK(normalizeMomentTag(tag)),
	})
}

type CreateRelationshipMomentTagOpts struct {
	WithInitialCount *bool
}

func (ms *MomentService) CreateRelationshipMomentTag(
	ctx context.Context,
	relationshipId string,
	dto CreateRelationshipMomentTagDto,
	opts ...CreateRelationshipMomentTagOpts,
) (*RelationshipMomentTagRecord, error) {
	normalizedTag := normalizeMomentTag(dto.Tag)
	existingTag, err := ms.GetRelationshipMomentTag(ctx, relationshipId, normalizedTag)

	if err != nil {
		return nil, err
	}

	if existingTag != nil {
		return nil, &models.ServiceError{
			StatusCode: http.StatusBadRequest,
			Message:    "There is already a tag with that name!",
		}
	}

	keys := RelationshipMomentTagKeys{}
	return dynamo.PutItem(ms.DynamoTable, dynamo.PutItemArgs[RelationshipMomentTagRecord]{
		Ctx: ctx,
		Item: RelationshipMomentTagRecord{
			DynamoPrimaryKey: dynamo.DynamoPrimaryKey{
				PK: keys.PK(relationshipId),
				SK: keys.SK(normalizedTag),
			},
			DynamoEntityType: dynamo.DynamoEntityType{
				EntityType: EntityTypeRelationshipMomentTag,
			},
			Tag: normalizedTag,
			AssociationCount: lo.Ternary(
				len(opts) > 0 && opts[0].WithInitialCount != nil && *opts[0].WithInitialCount,
				1,
				0,
			),
			RelationshipId: relationshipId,
			CreatedAt:      time.Now(),
		},
	})
}

func (ms *MomentService) CreateMomentTag(ctx context.Context, userId, relationshipId, momentId string, dto CreateMomentTagDto) (*MomentTagRecord, error) {
	normalizedTag, keys := normalizeMomentTag(dto.Tag), MomentTagKeys{}
	return dynamo.PutItem(ms.DynamoTable, dynamo.PutItemArgs[MomentTagRecord]{
		Ctx: ctx,
		Item: MomentTagRecord{
			DynamoPrimaryKey: dynamo.DynamoPrimaryKey{
				PK: keys.PK(momentId),
				SK: keys.SK(normalizedTag),
			},
			DynamoGSI1Keys: dynamo.DynamoGSI1Keys{
				GSI1PK: keys.GSI1PK(relationshipId),
				GSI1SK: keys.GSI1SK(normalizedTag),
			},
			DynamoEntityType: dynamo.DynamoEntityType{
				EntityType: EntityTypeMomentTag,
			},
			MomentId:       momentId,
			Tag:            normalizedTag,
			TaggerId:       userId,
			RelationshipId: relationshipId,
			CreatedAt:      time.Now(),
		},
	})
}

func (ms *MomentService) GetMomentsByTag(ctx context.Context, relationshipId string, dto GetMomentsByTagDto) (*dynamo.InfiniteData[MomentRecord], error) {
	keys := MomentTagKeys{}
	tagResults, err := dynamo.GetItems(
		ms.DynamoTable,
		dynamo.GetItemsParams[MomentTagRecord]{
			Ctx:   ctx,
			Index: lo.ToPtr(dynamo.GSI1),
			QueryExpression: dynamo.DynamoQueryExpression{
				Expression: "#gsi1pk = :gsi1pk AND begins_with(#gsi1sk, :gsi1sk)",
				Variables: map[string]any{
					":gsi1pk": keys.GSI1PK(relationshipId),
					":gsi1sk": normalizeMomentTag(dto.TagQuery),
				},
			},
			Cursor: dto.Cursor,
			Order:  lo.ToPtr(dto.GetOrder()),
			Limit:  lo.ToPtr(dto.GetLimit()),
		},
	)

	if err != nil {
		return nil, err
	}

	moments := dynamo.BatchGetItems[MomentRecord](
		ms.DynamoTable,
		dynamo.BatchGetItemsArgs{
			Ctx: ctx,
			Keys: lo.Map(
				tagResults.Data,
				func(item MomentTagRecord, _ int) dynamo.DynamoPrimaryKey {
					return dynamo.DynamoPrimaryKey{
						PK: item.PK,
						SK: item.SK,
					}
				},
			),
		},
	)

	for i, moment := range moments {
		attachUrlsToMoment(ctx, AttachUrlsToMomentArgs{
			Moment:      &moment,
			RedisClient: ms.RedisClient,
		})
		moments[i] = moment
	}

	return &dynamo.InfiniteData[MomentRecord]{
		Data:       moments,
		NextCursor: tagResults.NextCursor,
	}, nil
}

func (ms *MomentService) GetTagsForMoment(ctx context.Context, momentId string) ([]MomentTagRecord, error) {
	keys := MomentTagKeys{}
	tags, err := dynamo.GetItems(
		ms.DynamoTable,
		dynamo.GetItemsParams[MomentTagRecord]{
			Ctx: ctx,
			QueryExpression: dynamo.DynamoQueryExpression{
				Expression: "#pk = :pk",
				Variables: map[string]any{
					":pk": keys.PK(momentId),
				},
			},
			Exhaustive: lo.ToPtr(true),
		},
	)

	if err != nil {
		return nil, err
	}

	return tags.Data, nil
}

func (ms *MomentService) GetTagForMoment(ctx context.Context, momentId, tag string) (*MomentTagRecord, error) {
	keys := MomentTagKeys{}
	return dynamo.GetItem[MomentTagRecord](ms.DynamoTable, dynamo.GetItemArgs{
		Ctx: ctx,
		PK:  keys.PK(momentId),
		SK:  keys.SK(normalizeMomentTag(tag)),
	})
}

func (ms *MomentService) DeleteMomentTag(ctx context.Context, dto DeleteMomentTagDto) (bool, error) {
	normalizedTag, keys := normalizeMomentTag(dto.Tag), MomentTagKeys{}
	return dynamo.DeleteItem(ms.DynamoTable, dynamo.DeleteItemArgs{
		Ctx: ctx,
		PK:  keys.PK(dto.MomentId),
		SK:  keys.SK(normalizedTag),
	})
}

func (ms *MomentService) GetMomentUploadUrl(ctx context.Context, relationshipId string, dto models.GetUploadUrlDto) (*v4.PresignedHTTPRequest, error) {
	key, err := s3.ContentPathsRelationshipMoments(relationshipId, fmt.Sprintf("%s.%s", dto.ObjectKey, dto.FileExtension))

	if err != nil {
		return nil, err
	}

	args := s3.GetSignedURLArgs{
		Key:       key,
		ExpiresIn: lo.ToPtr(1 * time.Hour),
	}

	if dto.FileExtension != "" {
		args.ContentType = lo.ToPtr(mime.TypeByExtension("." + dto.FileExtension))
	}

	return ms.S3Bucket.GetSignedPutURL(ctx, args)
}
