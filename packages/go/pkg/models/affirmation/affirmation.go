package affirmation

import (
	"lumi/pkg/dynamo"
	"time"
)

const EntityTypeAffirmation dynamo.EntityType = "AFFIRMATION"
const EntityTypeReceivedAffirmation dynamo.EntityType = "RECEIVED_AFFIRMATION"

type AffirmationRecord struct {
	dynamo.DynamoPrimaryKey
	dynamo.DynamoEntityType
	Id             string `json:"id"`
	Affirmation    string `json:"affirmation"`
	SelectedCount  int    `json:"selectedCount"`
	RelationshipId string `json:"relationshipId"`
	OwnerId        string `json:"ownerId"`
}

func (ar AffirmationRecord) GetPK() string {
	return ar.PK
}

func (ar AffirmationRecord) GetSK() string {
	return ar.SK
}

type UpdateableAffirmationRecord struct {
	Affirmation   *dynamo.UpdateableDynamoField[string] `json:"affirmation"`
	SelectedCount *dynamo.UpdateableDynamoField[int]    `json:"selectedCount"`
}

func (ar UpdateableAffirmationRecord) GetUpdateTag() string {
	return "updateable-affirmation-record"
}

type AffirmationKeys struct{}

func (keys AffirmationKeys) BuildKey(suffix ...string) string {
	return dynamo.BuildDynamoKey("rship::affirmation", suffix...)
}

func (keys AffirmationKeys) PK(relationshipId string) string {
	return keys.BuildKey(relationshipId)
}

func (keys AffirmationKeys) SK(userId, relationshipId string) string {
	return keys.BuildKey(userId, relationshipId)
}

type ReceivedAffirmationRecord struct {
	dynamo.DynamoPrimaryKey
	dynamo.DynamoEntityType
	Affirmation string    `json:"affirmation"`
	Timestamp   time.Time `json:"timestamp"`
}

func (ar ReceivedAffirmationRecord) GetPK() string {
	return ar.PK
}

func (ar ReceivedAffirmationRecord) GetSK() string {
	return ar.SK
}

type ReceivedAffirmationKeys struct{}

func (keys ReceivedAffirmationKeys) BuildKey(suffix ...string) string {
	return dynamo.BuildDynamoKey("rship::received_affirmation", suffix...)
}

func (keys ReceivedAffirmationKeys) PK(relationshipId string) string {
	return keys.BuildKey(relationshipId)
}

func (keys ReceivedAffirmationKeys) SK(receiverId string, timestamp time.Time) string {
	return keys.BuildKey(receiverId, timestamp.Format(time.RFC3339))
}
