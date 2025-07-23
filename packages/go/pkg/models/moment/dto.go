package moment

import (
	"lumi/pkg/dynamo"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type CreateMomentDetailsDto struct {
	Title              string   `json:"title" validate:"required,max=90,min=1"`
	Description        string   `json:"description" validate:"max=1024"`
	ObjectKey          string   `json:"objectKey" validate:"required"`
	ThumbnailObjectKey *string  `json:"thumbnailObjectKey"`
	Tags               []string `json:"tags"`
}

type UpdateMomentDetailsDto struct {
	Title              *string  `json:"title" validate:"max=90,min=1"`
	Description        *string  `json:"description" validate:"max=1024"`
	ThumbnailObjectKey *string  `json:"thumbnailObjectKey"`
	Tags               []string `json:"tags"`
}

type GetInfiniteMomentsDto struct {
	Limit  *int32                          `json:"limit" validate:"min=1,max=100"`
	Cursor map[string]types.AttributeValue `json:"cursor"`
	Order  *dynamo.DynamoQueryOrder        `json:"order"`
}

func (dto *GetInfiniteMomentsDto) GetLimit() int32 {
	if dto.Limit == nil {
		return 10
	}
	return *dto.Limit
}

func (dto *GetInfiniteMomentsDto) GetCursor() map[string]types.AttributeValue {
	return dto.Cursor
}

func (dto *GetInfiniteMomentsDto) GetOrder() dynamo.DynamoQueryOrder {
	if dto.Order == nil {
		return dynamo.DescendingQueryOrder
	}
	return *dto.Order
}

type GetInfiniteMomentMessagesDto struct {
	MomentId string                          `json:"momentId" validate:"required,uuid4"`
	Limit    *int32                          `json:"limit" validate:"min=1,max=100"`
	Cursor   map[string]types.AttributeValue `json:"cursor"`
	Order    *dynamo.DynamoQueryOrder        `json:"order"`
}

func (dto *GetInfiniteMomentMessagesDto) GetLimit() int32 {
	if dto.Limit == nil {
		return 50
	}
	return *dto.Limit
}

func (dto *GetInfiniteMomentMessagesDto) GetCursor() map[string]types.AttributeValue {
	return dto.Cursor
}

func (dto *GetInfiniteMomentMessagesDto) GetOrder() dynamo.DynamoQueryOrder {
	if dto.Order == nil {
		return dynamo.DescendingQueryOrder
	}
	return *dto.Order
}

type CreateMomentMessageDto struct {
	MomentId  string  `json:"momentId" validate:"required,uuid4"`
	Content   string  `json:"content" validate:"required,min=1,max=1024"`
	RepliedTo string  `json:"repliedTo" validate:"uuid4"`
	Id        *string `json:"id" validate:"uuid4"`
	Timestamp *string `json:"timestamp" validate:"datetime=2006-01-02T15:04:05Z07:00"`
}

type UpdateMomentMessageDto struct {
	Content   *string             `json:"content" validate:"min=1,max=1024"`
	Reaction  *string             `json:"reaction"`
	State     *MomentMessageState `json:"state" validate:"oneof=sent delivered read"`
	MessageId string              `json:"messageId" validate:"required,uuid4"`
}

type SearchMomentsDto struct {
	Query  string                             `json:"query"`
	Limit  *int32                             `json:"limit" validate:"min=1,max=100"`
	Cursor [2]map[string]types.AttributeValue `json:"cursor"`
	Order  *dynamo.DynamoQueryOrder           `json:"order"`
}

func (dto *SearchMomentsDto) GetLimit() int32 {
	if dto.Limit == nil {
		return 10
	}
	return *dto.Limit
}

func (dto *SearchMomentsDto) GetCursor() map[string]types.AttributeValue {
	return dto.Cursor[0]
}

func (dto *SearchMomentsDto) GetOrder() dynamo.DynamoQueryOrder {
	if dto.Order == nil {
		return dynamo.DescendingQueryOrder
	}
	return *dto.Order
}

type GetRelationshipMomentTagsDto struct {
	Query  string                          `json:"query"`
	Limit  *int32                          `json:"limit" validate:"min=1,max=100"`
	Cursor map[string]types.AttributeValue `json:"cursor"`
}

func (dto *GetRelationshipMomentTagsDto) GetLimit() int32 {
	if dto.Limit == nil {
		return 10
	}
	return *dto.Limit
}

func (dto *GetRelationshipMomentTagsDto) GetCursor() map[string]types.AttributeValue {
	return dto.Cursor
}

type CreateRelationshipMomentTagDto struct {
	Tag string `json:"tag" validate:"required,min=1,max=50"`
}

type CreateMomentTagDto struct {
	Tag      string `json:"tag" validate:"required,min=1,max=50"`
	MomentId string `json:"momentId" validate:"uuid4"`
}

type GetMomentsByTagDto struct {
	TagQuery string                          `json:"tagQuery"`
	Limit    *int32                          `json:"limit" validate:"min=1,max=100"`
	Cursor   map[string]types.AttributeValue `json:"cursor"`
	Order    *dynamo.DynamoQueryOrder        `json:"order"`
}

func (dto *GetMomentsByTagDto) GetLimit() int32 {
	if dto.Limit == nil {
		return 10
	}
	return *dto.Limit
}

func (dto *GetMomentsByTagDto) GetCursor() map[string]types.AttributeValue {
	return dto.Cursor
}

func (dto *GetMomentsByTagDto) GetOrder() dynamo.DynamoQueryOrder {
	if dto.Order == nil {
		return dynamo.DescendingQueryOrder
	}
	return *dto.Order
}

type DeleteMomentTagDto struct {
	MomentId string `json:"momentId" validate:"required,uuid4"`
	Tag      string `json:"tag" validate:"required,min=1,max=50"`
}
