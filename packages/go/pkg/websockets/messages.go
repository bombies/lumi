package websockets

import (
	"encoding/json"
	"lumi/pkg/models/moment"
	"lumi/pkg/models/user"
	"time"
)

type TestPayload struct {
	Sender  string `json:"sender"`
	Message string `json:"message"`
}

type ConnectPayload struct {
	UserID   string `json:"userId"`
	Username string `json:"username"`
}

type DisconnectPayload struct {
	UserID   string `json:"userId"`
	Username string `json:"username"`
}

type PresencePayload struct {
	UserID   string          `json:"userId"`
	Username string          `json:"username"`
	Status   user.UserStatus `json:"status"`
}

type HeartbeatPayload struct {
	UserID         string `json:"userId"`
	Username       string `json:"username"`
	RelationshipID string `json:"relationshipId"`
}

type MomentChatPayload struct {
	SenderID  string `json:"senderId"`
	Message   string `json:"message"`
	MessageID string `json:"messageId,omitempty"`
	Timestamp string `json:"timestamp,omitempty"`
	MomentID  string `json:"momentId"`
}

type MomentTypingPayload struct {
	SenderID  string `json:"senderId"`
	Timestamp string `json:"timestamp"`
}

type MomentMessageReactPayload struct {
	SenderID  string `json:"senderId"`
	Timestamp string `json:"timestamp"`
	MessageID string `json:"messageId"`
	Reaction  string `json:"reaction"`
}

type MomentMessageDeletePayload struct {
	SenderID  string `json:"senderId"`
	Timestamp string `json:"timestamp"`
	MessageID string `json:"messageId"`
}

type MomentMessageStateUpdatePayload struct {
	SenderID  string                    `json:"senderId"`
	Timestamp string                    `json:"timestamp"`
	MessageID string                    `json:"messageId"`
	State     moment.MomentMessageState `json:"state,omitempty"`
	Content   string                    `json:"content,omitempty"`
}

// Nested structs for the NotificationPayload
type NotificationFrom struct {
	Type string `json:"type"` // "user" or "system"
	ID   string `json:"id,omitempty"`
}

type NotificationMessage struct {
	Title   string `json:"title"`
	Content string `json:"content"`
	OpenUrl string `json:"openUrl,omitempty"`
}

type NotificationPayload struct {
	ReceiverID string              `json:"receiverId"`
	From       NotificationFrom    `json:"from"`
	Message    NotificationMessage `json:"message"`
	Metadata   map[string]any      `json:"metadata,omitempty"`
}

type WebsocketMessageSource string

const (
	WebsocketMessageSourceServer WebsocketMessageSource = "server"
	WebsocketMessageSourceClient WebsocketMessageSource = "client"
)

type WebsocketMessage struct {
	Type      WebsocketEvent         `json:"type"`
	Payload   json.RawMessage        `json:"payload"`
	Timestamp time.Time              `json:"timestamp"`
	Id        string                 `json:"id,omitempty"`
	Source    WebsocketMessageSource `json:"source,omitempty"`
}

type TypedWebsocketMessage[T any] struct {
	Type      WebsocketEvent         `json:"type"`
	Payload   T                      `json:"payload"`
	Timestamp time.Time              `json:"timestamp"`
	Id        string                 `json:"id,omitempty"`
	Source    WebsocketMessageSource `json:"source,omitempty"`
}
