package relationship

import (
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type CreateRelationshipRequestDto struct {
	SenderId   string `json:"senderId" binding:"required"`
	ReceiverId string `json:"receiverId" binding:"required"`
}

type GetRelationshipRequestsForUserDto struct {
	Limit  int32                           `json:"limit" form:"limit" binding:"min=1,max=100"`
	Cursor map[string]types.AttributeValue `json:"cursor" form:"cursor"`
}

func (dto *GetRelationshipRequestsForUserDto) GetLimit() int32 {
	return dto.Limit
}

func (dto *GetRelationshipRequestsForUserDto) GetCursor() map[string]types.AttributeValue {
	return dto.Cursor
}

type UpdateRelationshipDto struct {
	Anniversary *string `json:"anniversary" time_format:"2006-01-02T15:04:05Z07:00"`
}
