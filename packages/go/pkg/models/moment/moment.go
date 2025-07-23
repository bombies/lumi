package moment

import (
	"lumi/pkg/dynamo"
	"time"
)

const EntityTypeMomentDetails dynamo.EntityType = "MOMENT_DETAILS"

type MomentRecord struct {
	dynamo.DynamoPrimaryKey
	dynamo.DynamoGSI1Keys
	dynamo.DynamoGSI2Keys
	dynamo.DynamoEntityType
	Id                 string    `json:"id"`
	Title              string    `json:"title"`
	NormalizedTitle    string    `json:"normalizedTitle"`
	Description        string    `json:"description"`
	ObjectKey          string    `json:"objectKey"`
	ThumbnailObjectKey *string   `json:"thumbnailObjectKey"`
	RelationshipId     string    `json:"relationshipId"`
	UserId             string    `json:"userId"`
	CreatedAt          time.Time `json:"createdAt"`
	VideoURL           *string   `json:"videoUrl"`
	ThumbnailUrl       *string   `json:"thumbnailUrl"`
}

func (mr MomentRecord) GetPK() string {
	return mr.PK
}

func (mr MomentRecord) GetSK() string {
	return mr.SK
}

func (mr MomentRecord) GetGSI1() (*string, *string) {
	return &mr.GSI1PK, &mr.GSI1SK
}

func (mr MomentRecord) GetGSI2() (*string, *string) {
	return &mr.GSI2PK, &mr.GSI2SK
}

type UpdateableMomentRecord struct {
	Title              *dynamo.UpdateableDynamoField[string] `json:"title"`
	NormalizedTitle    *dynamo.UpdateableDynamoField[string] `json:"normalizedTitle"`
	Description        *dynamo.UpdateableDynamoField[string] `json:"description"`
	ThumbnailObjectKey *dynamo.UpdateableDynamoField[string] `json:"thumbnailObjectKey"`
}

func (mr UpdateableMomentRecord) GetUpdateTag() string {
	return "updateable-moment-record"
}

type MomentKeys struct{}

func (keys MomentKeys) BuildKey(suffix ...string) string {
	return dynamo.BuildDynamoKey("moment::details", suffix...)
}

func (keys MomentKeys) PK(momentId string) string {
	return keys.BuildKey(momentId)
}

func (keys MomentKeys) SK(momentId string) string {
	return keys.BuildKey(momentId)
}

func (keys MomentKeys) GSI1PK(relationshipId string) string {
	return keys.BuildKey(relationshipId)
}

func (keys MomentKeys) GSI1SK(timestamp time.Time) string {
	return keys.BuildKey(timestamp.Format(time.RFC3339))
}

func (keys MomentKeys) GSI2PK(userId string) string {
	return keys.BuildKey(userId)
}

func (keys MomentKeys) GSI2SK(timestamp time.Time) string {
	return keys.BuildKey(timestamp.Format(time.RFC3339))
}
