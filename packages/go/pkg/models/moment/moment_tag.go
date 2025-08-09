package moment

import (
	"lumi/pkg/dynamo"
	"time"
)

const EntityTypeRelationshipMomentTag dynamo.EntityType = "RELATIONSHIP_MOMENT_TAG"
const EntityTypeMomentTag dynamo.EntityType = "MOMENT_TAG"

type RelationshipMomentTagRecord struct {
	dynamo.DynamoPrimaryKey
	dynamo.DynamoEntityType
	Tag              string    `json:"tag"`
	AssociationCount int       `json:"associationCount"`
	RelationshipId   string    `json:"relationshipId"`
	CreatedAt        time.Time `json:"createdAt"`
}

func (mr RelationshipMomentTagRecord) GetPK() string {
	return mr.PK
}

func (mr RelationshipMomentTagRecord) GetSK() string {
	return mr.SK
}

type UpdateableRelationshipMomentTagRecord struct {
	AssociationCount dynamo.UpdateableDynamoField[int] `json:"associationCount,omitempty"`
}

func (ur UpdateableRelationshipMomentTagRecord) GetUpdateTag() string {
	return "updateable-relationship-moment-tag"
}

type RelationshipMomentTagKeys struct{}

func (keys RelationshipMomentTagKeys) BuildKey(suffix ...string) string {
	return dynamo.BuildDynamoKey("relationship::moment::tag", suffix...)
}

func (keys RelationshipMomentTagKeys) PK(relationshipId string) string {
	return keys.BuildKey(relationshipId)
}

func (keys RelationshipMomentTagKeys) SK(tag string) string {
	return keys.BuildKey(tag)
}

type MomentTagRecord struct {
	dynamo.DynamoPrimaryKey
	dynamo.DynamoGSI1Keys
	dynamo.DynamoEntityType
	Tag            string    `json:"tag"`
	MomentId       string    `json:"momentId"`
	RelationshipId string    `json:"relationshipId"`
	TaggerId       string    `json:"taggerId"`
	CreatedAt      time.Time `json:"createdAt"`
}

func (mt MomentTagRecord) GetPK() string {
	return mt.PK
}

func (mt MomentTagRecord) GetSK() string {
	return mt.SK
}

func (mt MomentTagRecord) GetGSI1() (*string, *string) {
	return &mt.GSI1PK, &mt.GSI1SK
}

type MomentTagKeys struct{}

func (keys MomentTagKeys) BuildKey(suffix ...string) string {
	return dynamo.BuildDynamoKey("moment::tag", suffix...)
}

func (keys MomentTagKeys) PK(momentId string) string {
	return keys.BuildKey(momentId)
}

func (keys MomentTagKeys) SK(tag string) string {
	return keys.BuildKey(tag)
}

func (keys MomentTagKeys) GSI1PK(relationshipId string) string {
	rshipMomentTagKeys := RelationshipMomentTagKeys{}
	return rshipMomentTagKeys.PK(relationshipId)
}

func (keys MomentTagKeys) GSI1SK(tag string) string {
	return tag
}
