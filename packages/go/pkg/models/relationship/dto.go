package relationship

import (
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type CreateRelationshipRequestDto struct {
	SenderId   string `json:"senderId" validate:"required"`
	ReceiverId string `json:"receiverId" validate:"required"`
}

type GetRelationshipRequestsForUserDto struct {
	Limit  int32                           `json:"limit" validate:"min=1,max=100"`
	Cursor map[string]types.AttributeValue `json:"cursor"`
	UserId string                          `json:"userId" validate:"required"`
}

func (dto *GetRelationshipRequestsForUserDto) GetLimit() int32 {
	return dto.Limit
}

func (dto *GetRelationshipRequestsForUserDto) GetCursor() map[string]types.AttributeValue {
	return dto.Cursor
}

type UpdateRelationshipDto struct {
	Anniversary *string `json:"anniversary" validate:"datetime=2006-01-02T15:04:05Z07:00"`
}
