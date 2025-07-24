package notification

import (
	"lumi/pkg/dynamo"
	"time"

	"github.com/samber/lo"
)

const EntityTypeNotification dynamo.EntityType = "NOTIFICATION"
const EntityTypeNotificationSubscriber dynamo.EntityType = "NOTIFICATION_SUBSCRIBER"
const EntityTypeUnreadNotificationCount dynamo.EntityType = "UNREAD_NOTIFICATION_COUNT"

type NotificationRecord struct {
	dynamo.DynamoPrimaryKey
	dynamo.DynamoGSI1Keys
	dynamo.DynamoGSI2Keys
	dynamo.DynamoEntityType
	Id        string    `json:"id"`
	UserId    string    `json:"userId"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	Read      bool      `json:"read"`
	OpenUrl   *string   `json:"openUrl,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
}

func (nr NotificationRecord) GetPK() string {
	return nr.PK
}

func (nr NotificationRecord) GetSK() string {
	return nr.SK
}

func (nr NotificationRecord) GetGSI1() (*string, *string) {
	return &nr.GSI1PK, &nr.GSI1SK
}

func (nr NotificationRecord) GetGSI2() (*string, *string) {
	return &nr.GSI2PK, &nr.GSI2SK
}

type UpdateableNotificationRecord struct {
	dynamo.UpdateableGlobalIndex2Keys
	Read *dynamo.UpdateableDynamoField[bool] `json:"read"`
}

func (un UpdateableNotificationRecord) GetUpdateTag() string {
	return `updateable-notification-record`
}

type NotificationKeys struct{}

func (keys NotificationKeys) BuildKey(suffix ...string) string {
	return dynamo.BuildDynamoKey("notification", suffix...)
}

func (keys NotificationKeys) PK(notificationId string) string {
	return keys.BuildKey(notificationId)
}

func (keys NotificationKeys) SK(notificationId string) string {
	return keys.BuildKey(notificationId)
}

func (keys NotificationKeys) GSI1PK(userId string) string {
	return keys.BuildKey(userId)
}

func (keys NotificationKeys) GSI1SK(timestamp time.Time) string {
	return keys.BuildKey(timestamp.Format(time.RFC3339))
}

func (keys NotificationKeys) GSI2PK(userId string) string {
	return keys.BuildKey(userId)
}

func (keys NotificationKeys) GSI2SK(read bool, timestamp time.Time) string {
	return keys.BuildKey(lo.Ternary(read, "read", "unread"), timestamp.Format(time.RFC3339))
}

type UnreadNotificationCountRecord struct {
	dynamo.DynamoPrimaryKey
	dynamo.DynamoEntityType
	UserId string `json:"userId"`
	Count  int    `json:"count"`
}

func (nr UnreadNotificationCountRecord) GetPK() string {
	return nr.PK
}

func (nr UnreadNotificationCountRecord) GetSK() string {
	return nr.SK
}

type UpdateableUnreadNotificationCountRecord struct {
	Count *dynamo.UpdateableDynamoField[int] `json:"count"`
}

type UnreadNotificationCountKeys struct{}

func (keys UnreadNotificationCountKeys) BuildKey(suffix ...string) string {
	return dynamo.BuildDynamoKey("unread::notification::count", suffix...)
}

func (keys UnreadNotificationCountKeys) PK(userId string) string {
	return keys.BuildKey(userId)
}

func (keys UnreadNotificationCountKeys) SK(userId string) string {
	return keys.BuildKey(userId)
}

type NotificationSubscriberKeysRecord struct {
	Auth   string `json:"auth"`
	P256dh string `json:"p256dh"`
}

type PushSubscription struct {
	Endpoint       string                           `json:"endpoint"`
	ExpirationTime *int                             `json:"expirationTime,omitempty"`
	Keys           NotificationSubscriberKeysRecord `json:"keys"`
}

type NotificationSubscriberRecord struct {
	dynamo.DynamoPrimaryKey
	dynamo.DynamoEntityType
	SubsriberId    string                           `json:"subscriberId"`
	Keys           NotificationSubscriberKeysRecord `json:"keys"`
	Endpoint       string                           `json:"endpoint"`
	ExpirationTime *int                             `json:"expirationTime,omitempty"`
}

func (nr NotificationSubscriberRecord) GetPK() string {
	return nr.PK
}

func (nr NotificationSubscriberRecord) GetSK() string {
	return nr.SK
}

type NotificationSubscriberKeys struct{}

func (keys NotificationSubscriberKeys) BuildKey(suffix ...string) string {
	return dynamo.BuildDynamoKey("notification::subscriber", suffix...)
}

func (keys NotificationSubscriberKeys) PK(userId string) string {
	return keys.BuildKey(userId)
}

func (keys NotificationSubscriberKeys) SK(endpoint string) string {
	return keys.BuildKey(endpoint)
}

type NotificationPayload struct {
	Title    string         `json:"title"`
	Body     string         `json:"body"`
	OpenUrl  *string        `json:"openUrl,omitempty"`
	Metadata map[string]any `json:"metadata,omitempty"`
}
