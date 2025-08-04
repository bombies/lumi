package moment

import (
	"lumi/pkg/dynamo"
	"time"
)

const EntityTypeMomentMessage dynamo.EntityType = "MOMENT_MESSAGE"

type MomentMessageState string

const (
	MomentMessageStateSent      MomentMessageState = "sent"
	MomentMessageStateDelivered MomentMessageState = "delivered"
	MomentMessageStateRead      MomentMessageState = "read"
)

type MomentMessageRecord struct {
	dynamo.DynamoPrimaryKey
	dynamo.DynamoGSI1Keys
	dynamo.DynamoEntityType
	Id        string              `json:"id"`
	SenderId  string              `json:"senderId"`
	MomentId  string              `json:"momentId"`
	Content   string              `json:"content"`
	RepliedTo string              `json:"repliedTo,omitempty"`
	Reaction  string              `json:"reaction,omitempty"`
	IsDeleted bool                `json:"isDeleted"`
	State     *MomentMessageState `json:"state,omitempty"`
	Timestamp time.Time           `json:"timestamp"`
	UpdatedAt *time.Time          `json:"updatedAt,omitempty"`
}

func (mm MomentMessageRecord) GetPK() string {
	return mm.PK
}

func (mm MomentMessageRecord) GetSK() string {
	return mm.SK
}

func (mm MomentMessageRecord) GetGSI1() (*string, *string) {
	return &mm.GSI1PK, &mm.GSI1SK
}

type UpdateableMomentMessageRecord struct {
	Content   *dynamo.UpdateableDynamoField[string]             `json:"content"`
	Reaction  *dynamo.UpdateableDynamoField[string]             `json:"reaction"`
	State     *dynamo.UpdateableDynamoField[MomentMessageState] `json:"state"`
	IsDeleted *dynamo.UpdateableDynamoField[bool]               `json:"isDeleted"`
	UpdatedAt *dynamo.UpdateableDynamoField[time.Time]          `json:"updatedAt"`
}

func (mm UpdateableMomentMessageRecord) GetUpdateTag() string {
	return "updateable-moment-message-record"
}

type MomentMessageKeys struct{}

func (keys MomentMessageKeys) BuildKey(suffix ...string) string {
	return dynamo.BuildDynamoKey("moment::message", suffix...)
}

func (keys MomentMessageKeys) PK(messageId string) string {
	return keys.BuildKey(messageId)
}

func (keys MomentMessageKeys) SK(messageId string) string {
	return keys.BuildKey(messageId)
}

func (keys MomentMessageKeys) GSI1PK(momentId string) string {
	return keys.BuildKey(momentId)
}

func (keys MomentMessageKeys) GSI1SK(timestamp time.Time) string {
	return keys.BuildKey(timestamp.Format(time.RFC3339))
}
