package moment

import (
	"lumi/pkg/dynamo"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type CreateMomentDetailsDto struct {
	Title              string   `json:"title" binding:"required,max=90,min=1"`
	Description        string   `json:"description" binding:"max=1024"`
	ObjectKey          string   `json:"objectKey" binding:"required"`
	ThumbnailObjectKey *string  `json:"thumbnailObjectKey"`
	Tags               []string `json:"tags"`
}

type UpdateMomentDetailsDto struct {
	Title              *string  `json:"title" binding:"max=90,min=1"`
	Description        *string  `json:"description" binding:"max=1024"`
	ThumbnailObjectKey *string  `json:"thumbnailObjectKey"`
	Tags               []string `json:"tags"`
}

type GetInfiniteMomentsDto struct {
	Limit  *int32                          `json:"limit" form:"limit" binding:"min=1,max=100"`
	Cursor map[string]types.AttributeValue `json:"cursor" form:"cursor"`
	Order  *dynamo.DynamoQueryOrder        `json:"order" form:"order"`
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
	Limit  *int32                          `json:"limit" form:"limit" binding:"min=1,max=100"`
	Cursor map[string]types.AttributeValue `json:"cursor" form:"cursor"`
	Order  *dynamo.DynamoQueryOrder        `json:"order" form:"order"`
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
	Content   string  `json:"content" binding:"required,min=1,max=1024"`
	RepliedTo string  `json:"repliedTo,omitempty" binding:"omitempty,uuid4"`
	Id        *string `json:"id,omitempty" binding:"omitempty,uuid4"`
	Timestamp *string `json:"timestamp,omitempty" binding:"omitempty" time_format:"2006-01-02T15:04:05Z07:00"`
}

type UpdateMomentMessageDto struct {
	Content  *string             `json:"content,omitempty" binding:"omitempty,min=1,max=1024"`
	Reaction *string             `json:"reaction,omitempty"`
	State    *MomentMessageState `json:"state,omitempty" binding:"omitempty,oneof=sent delivered read"`
}

type SearchMomentsDto struct {
	Query  string                             `json:"query" form:"query"`
	Limit  *int32                             `json:"limit,omitempty" form:"limit" binding:"omitempty,min=1,max=100"`
	Cursor [2]map[string]types.AttributeValue `json:"cursor" form:"cursor"`
	Order  *dynamo.DynamoQueryOrder           `json:"order,omitempty" form:"order"`
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

type ReactToMessageDto struct {
	Reaction string `json:"reaction" binding:"required"`
}

type GetRelationshipMomentTagsDto struct {
	Query  string                          `json:"query" form:"query"`
	Limit  *int32                          `json:"limit,omitempty" form:"limit" binding:"omitempty,min=1,max=100"`
	Cursor map[string]types.AttributeValue `json:"cursor" form:"cursor"`
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
	Tag string `json:"tag" binding:"required,min=1,max=50"`
}

type CreateMomentTagDto struct {
	Tag string `json:"tag" binding:"required,min=1,max=50"`
}

type GetMomentsByTagDto struct {
	TagQuery string                          `json:"tagQuery" form:"tagQuery"`
	Limit    *int32                          `json:"limit,omitempty" form:"limit" binding:"omitempty,min=1,max=100"`
	Cursor   map[string]types.AttributeValue `json:"cursor" form:"cursor"`
	Order    *dynamo.DynamoQueryOrder        `json:"order,omitempty" form:"order" binding:"omitempty,oneof=asc desc"`
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
	MomentId string `json:"momentId" binding:"required,uuid4"`
	Tag      string `json:"tag" binding:"required,min=1,max=50"`
}
