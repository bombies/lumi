package songrecommendation

import (
	"lumi/pkg/dynamo"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type CreateSongRecommendationDto struct {
	Id         string  `json:"id" binding:"required"`
	Uri        string  `json:"uri" binding:"required"`
	Name       string  `json:"name" binding:"required"`
	ArtistName string  `json:"artistName" binding:"required"`
	AlbumImage *string `json:"albumImage,omitempty"`
	Duration   int     `json:"duration" binding:"required"`
}

type SongRecommendationFilter string

const (
	SongRecommendationFilterListened   SongRecommendationFilter = "listened"
	SongRecommendationFilterUnlistened SongRecommendationFilter = "unlistened"
)

type GetSongRecommendationsDto struct {
	Limit  *int32                          `json:"limit" form:"limit" binding:"min=1,max=100"`
	Cursor map[string]types.AttributeValue `json:"cursor" form:"cursor"`
	Order  *dynamo.DynamoQueryOrder        `json:"order" form:"order"`
	Filter *SongRecommendationFilter       `json:"filter,omitempty" form:"filter"`
}

func (dto *GetSongRecommendationsDto) GetLimit() int32 {
	if dto.Limit == nil {
		return 10
	}
	return *dto.Limit
}

func (dto *GetSongRecommendationsDto) GetCursor() map[string]types.AttributeValue {
	return dto.Cursor
}

func (dto *GetSongRecommendationsDto) GetOrder() dynamo.DynamoQueryOrder {
	if dto.Order == nil {
		return dynamo.DescendingQueryOrder
	}
	return *dto.Order
}

type UpdateSongRecommendationDto struct {
	Listened *bool    `json:"listened,omitempty"`
	Rating   *float32 `json:"rating" binding:"min=0,max=10"`
	Comments *string  `json:"comments,omitempty"`
}
