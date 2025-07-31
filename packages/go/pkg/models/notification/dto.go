package notification

import (
	"time"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type CreateNotificationDto struct {
	Title   string  `json:"title" binding:"required"`
	Content string  `json:"content" binding:"required"`
	OpenUrl *string `json:"openUrl,omitempty"`
	Read    *bool   `json:"read,omitempty"`
}

type GetNotificationsDto struct {
	TagQuery string                          `json:"tagQuery" form:"tagQuery"`
	Limit    *int32                          `json:"limit,omitempty" form:"limit" binding:"omitempty,min=1,max=100"`
	Cursor   map[string]types.AttributeValue `json:"cursor" form:"cursor"`
}

func (dto *GetNotificationsDto) GetLimit() int32 {
	if dto.Limit == nil {
		return 10
	}
	return *dto.Limit
}

func (dto *GetNotificationsDto) GetCursor() map[string]types.AttributeValue {
	return dto.Cursor
}

type NotificationFilter string

const (
	NotificationFilterRead   NotificationFilter = "read"
	NotificationFilterUnread NotificationFilter = "unread"
)

type GetFilteredNotificationsDto struct {
	TagQuery string                          `json:"tagQuery" form:"tagQuery"`
	Limit    *int32                          `json:"limit,omitempty" form:"limit" binding:"omitempty,min=1,max=100"`
	Cursor   map[string]types.AttributeValue `json:"cursor" form:"cursor"`
	Filter   NotificationFilter              `json:"filter" form:"filter" binding:"oneof=read unread"`
}

func (dto *GetFilteredNotificationsDto) GetLimit() int32 {
	if dto.Limit == nil {
		return 10
	}
	return *dto.Limit
}

func (dto *GetFilteredNotificationsDto) GetCursor() map[string]types.AttributeValue {
	return dto.Cursor
}

type UpdateNotificationDto struct {
	Read *bool `json:"read,omitempty"`
}

type UpdateNotificationCountDto struct {
	Count *int `json:"count,omitempty"`
}

type NotificationData struct {
	Id        string    `json:"id"`
	CreatedAt time.Time `json:"createdAt"`
}
