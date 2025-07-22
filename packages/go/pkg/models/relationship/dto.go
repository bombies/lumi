package relationship

import (
	"time"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type CreateRelationshipRequestDto struct {
	SenderId   string `json:"senderId" validate:"required"`
	ReceiverId string `json:"receiverId" validate:"required"`
}

type GetRelationshipRequestsForUserDto struct {
	Limit  int                             `json:"limit" validate:"min=1,max=100"`
	Cursor map[string]types.AttributeValue `json:"cursor"`
	UserId string                          `json:"userId" validate:"required"`
}

func (dto *GetRelationshipRequestsForUserDto) GetLimit() int {
	return dto.Limit
}

func (dto *GetRelationshipRequestsForUserDto) GetCursor() map[string]types.AttributeValue {
	return dto.Cursor
}

type UpdateRelationshipDto struct {
	Anniversary *time.Time `json:"anniversary" validate:"datetime"`
}
