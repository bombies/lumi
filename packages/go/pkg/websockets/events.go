package websockets

type WebsocketEvent string

const (
	WebsocketEventTest                WebsocketEvent = "test"
	WebsocketEventConnect             WebsocketEvent = "connect"
	WebsocketEventDisconnect          WebsocketEvent = "disconnect"
	WebsocketEventPresence            WebsocketEvent = "presence"
	WebsocketEventHeartbeat           WebsocketEvent = "heartbeat"
	WebsocketEventNotification        WebsocketEvent = "notification"
	WebsocketEventMomentChat          WebsocketEvent = "momentChat"
	WebsocketEventMomentTypingStart   WebsocketEvent = "momentTypingStart"
	WebsocketEventMomentTypingEnd     WebsocketEvent = "momentTypingEnd"
	WebsocketEventMomentMessageReact  WebsocketEvent = "momentMessageReact"
	WebsocketEventMomentMessageDelete WebsocketEvent = "momentMessageDelete"
	WebsocketEventMomentStateUpdate   WebsocketEvent = "momentMessageStateUpdate"
)
