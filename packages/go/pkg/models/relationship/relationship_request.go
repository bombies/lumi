package relationship

import (
	"lumi/pkg/dynamo"
	"strings"
	"time"
)

const EntityTypeRelationshipRequestRecord dynamo.EntityType = "RELATIONSHIP_REQUEST"

type RelationshipRequestRecord struct {
	dynamo.DynamoPrimaryKey
	dynamo.DynamoGSI1Keys
	dynamo.DynamoGSI2Keys
	dynamo.DynamoEntityType
	Id        string                        `json:"id"`
	Sender    string                        `json:"sender"`
	Receiver  string                        `json:"receiver"`
	CreatedAt time.Time                     `json:"createdAt"`
	OtherUser *RelationshipRequestOtherUser `json:"otherUser"`
}

type RelationshipRequestOtherUser struct {
	Id        string `json:"id"`
	Username  string `json:"username"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
}

func (r RelationshipRequestRecord) GetPK() string {
	return r.PK
}

func (r RelationshipRequestRecord) GetSK() string {
	return r.SK
}

func (r RelationshipRequestRecord) GetGSI1() (*string, *string) {
	return &r.GSI1PK, &r.GSI1SK
}

type RelationshipRequestKeys struct{}

func (r *RelationshipRequestKeys) BuildKey(suffix ...string) string {
	return dynamo.BuildDynamoKey("rshipreq", suffix...)
}

func (r *RelationshipRequestKeys) PK(requestId string) string {
	return r.BuildKey(requestId)
}

func (r *RelationshipRequestKeys) SK(requestId string) string {
	return r.BuildKey(requestId)
}

const (
	RelationshipRequestKeysSenderPrefix   string = "rship::sender"
	RelationshipRequestKeysReceiverPrefix string = "rship::receiver"
)

func (r *RelationshipRequestKeys) GSI1PK() string {
	return RelationshipRequestKeysSenderPrefix
}

func (r *RelationshipRequestKeys) GSI1SK(senderId string) string {
	return strings.Join([]string{RelationshipRequestKeysSenderPrefix, senderId}, "#")
}

func (r *RelationshipRequestKeys) GSI2PK() string {
	return RelationshipRequestKeysReceiverPrefix
}

func (r *RelationshipRequestKeys) GSI2SK(receiverId string) string {
	return strings.Join([]string{RelationshipRequestKeysReceiverPrefix, receiverId}, "#")
}
