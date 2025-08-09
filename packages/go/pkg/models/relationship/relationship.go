package relationship

import (
	"lumi/pkg/dynamo"
	"lumi/pkg/models/user"
	"time"
)

const EntityTypeRelationshipRecord dynamo.EntityType = "RELATIONSHIP"

type RelationshipRecord struct {
	dynamo.DynamoPrimaryKey
	dynamo.DynamoGSI1Keys
	dynamo.DynamoEntityType
	Id              string           `json:"id"`
	Partner1        string           `json:"partner1"`
	Partner2        string           `json:"partner2"`
	Partner         *user.UserRecord `json:"partner,omitempty"`
	Self            *user.UserRecord `json:"self,omitempty"`
	CreatedAt       time.Time        `json:"createdAt"`
	Anniversary     string           `json:"anniversary,omitempty"`
	AnniversaryMMDD string           `json:"anniversaryMMDD,omitempty"`
}

func (r RelationshipRecord) GetPK() string {
	return r.PK
}

func (r RelationshipRecord) GetSK() string {
	return r.SK
}

func (r RelationshipRecord) GetGSI1() (*string, *string) {
	return &r.GSI1PK, &r.GSI1SK
}

type UpdateableRelationshipRecord struct {
	dynamo.UpdateableGlobalIndex1Keys
	Anniversary     dynamo.UpdateableDynamoField[string] `json:"anniversary,omitempty"`
	AnniversaryMMDD dynamo.UpdateableDynamoField[string] `json:"anniversaryMMDD,omitempty"`
}

func (r UpdateableRelationshipRecord) GetUpdateTag() string {
	return "updateable-relationship-record"
}

type RelationshipKeys struct{}

func (r *RelationshipKeys) BuildKey(suffix ...string) string {
	return dynamo.BuildDynamoKey("rship", suffix...)
}

func (r *RelationshipKeys) PK(relationshipId string) string {
	return r.BuildKey(relationshipId)
}

func (r *RelationshipKeys) SK(relationshipId string) string {
	return r.BuildKey(relationshipId)
}

func (r *RelationshipKeys) GSI1PK() string {
	return r.BuildKey("anniversary")
}

func (r *RelationshipKeys) GSI1SK(anniversaryMMDD, relationshipId string) string {
	return r.BuildKey(anniversaryMMDD, relationshipId)
}
