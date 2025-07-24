package websockets

import (
	"lumi/pkg/dynamo"
	"time"
)

type WebsocketToken string

const (
	WebsocketTokenRelationshipUser WebsocketToken = "relationship_user"
	WebsocketTokenGlobal           WebsocketToken = "global"
)

type WebsocketSubTopic string

const (
	WebsocketSubTopicRelationship WebsocketSubTopic = "relationship"
	WebsocketSubTopicHeartbeat    WebsocketSubTopic = "heartbeat"
	WebsocketSubTopicMomentChat   WebsocketSubTopic = "moment_chat"
)

const EntityTypeWebsocketHeartbeat dynamo.EntityType = "WEBSOCKET_HEARTBREAT"

type WebsocketHeartbeatRecord struct {
	dynamo.DynamoPrimaryKey
	dynamo.DynamoEntityType
	Timestamp time.Time        `json:"timestamp"`
	Payload   HeartbeatPayload `json:"payload"`
}

func (hb WebsocketHeartbeatRecord) GetPK() string {
	return hb.PK
}

func (hb WebsocketHeartbeatRecord) GetSK() string {
	return hb.SK
}

type WebsocketHeartbeatKeys struct{}

func (keys WebsocketHeartbeatKeys) BuildKey(suffix ...string) string {
	return dynamo.BuildDynamoKey("ws::heartbeat", suffix...)
}

func (keys WebsocketHeartbeatKeys) PK() string {
	return keys.BuildKey()
}

func (keys WebsocketHeartbeatKeys) SK(clientId string) string {
	return keys.BuildKey(clientId)
}
