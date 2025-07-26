package affirmation

import (
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type CreateAffirmationDto struct {
	Affirmation string `json:"affirmation" binding:"required,min=1,max=150"`
}

type UpdateAffirmationDto struct {
	Affirmation   *string `json:"affirmation" binding:"min=1,max=150"`
	SelectedCount *int    `json:"selectedCount" binding:"min=0"`
}

type UserFacingUpdateAffirmationDto struct {
	Affirmation *string `json:"affirmation" binding:"min=1,max=150"`
}

type GetReceivedAffirmationsDto struct {
	Limit  *int32                          `json:"limit" form:"limit" binding:"min=1,max=100"`
	Cursor map[string]types.AttributeValue `json:"cursor" form:"cursor"`
}

func (dto *GetReceivedAffirmationsDto) GetLimit() int32 {
	if dto.Limit == nil {
		return 50
	}
	return *dto.Limit
}

func (dto *GetReceivedAffirmationsDto) GetCursor() map[string]types.AttributeValue {
	return dto.Cursor
}

type SendCustomAffirmationDto struct {
	Affirmation string `json:"affirmation" binding:"required,min=1,max=150"`
}
