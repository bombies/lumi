package websockets

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"lumi/pkg/dynamo"
	"lumi/pkg/utils"
	"net/url"
	"os"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/samber/lo"
)

type WebsocketService struct {
	Client      mqtt.Client
	DynamoTable *dynamo.DynamoTable
	Logger      *log.Logger
}

type CreateWebsocketConnectionArgs struct {
	Endpoint   string
	Authorizer string
	Token      WebsocketToken
	Identifier string
}

func NewSocketService(dynamoTable *dynamo.DynamoTable) *WebsocketService {
	logger := log.New(os.Stdout, "ws-service: ", log.LstdFlags)
	return &WebsocketService{
		DynamoTable: dynamoTable,
		Logger:      logger,
	}
}

func (ws *WebsocketService) CreateConnection(args CreateWebsocketConnectionArgs) error {
	if ws.Client != nil && ws.Client.IsConnected() {
		ws.Client.Disconnect(75)
	}

	clientId := fmt.Sprintf("client_%s", lo.Ternary(args.Identifier != "", args.Identifier, utils.GetUUID()))

	socketUrl, err := url.Parse(fmt.Sprintf("wss://%s/mqtt", args.Endpoint))
	if err != nil {
		return fmt.Errorf("failed to parse endpoint url: %w", err)
	}
	q := socketUrl.Query()
	q.Set("x-amz-customauthorizer-name", args.Authorizer)
	socketUrl.RawQuery = q.Encode()

	opts := mqtt.NewClientOptions()
	opts.AddBroker(socketUrl.String())
	opts.SetClientID(clientId)
	opts.SetProtocolVersion(4)

	password := clientId
	if args.Token != "" {
		password += "::" + string(args.Token)
	}
	opts.SetPassword(password)

	opts.SetOnConnectHandler(func(client mqtt.Client) {
		ws.Logger.Printf("Connected successfully to %s\n", args.Endpoint)
	})
	opts.SetConnectionLostHandler(func(client mqtt.Client, err error) {
		ws.Logger.Printf("Connection lost: %v\n", err)
	})
	opts.SetReconnectingHandler(func(client mqtt.Client, options *mqtt.ClientOptions) {
		ws.Logger.Println("Attempting to reconnect...")
	})

	ws.Client = mqtt.NewClient(opts)

	if token := ws.Client.Connect(); token.WaitTimeout(10*time.Second) && token.Error() != nil {
		return fmt.Errorf("failed to connect: %w", token.Error())
	}

	return nil
}

type EmitEventArgs struct {
	Topic   string
	Event   WebsocketEvent
	Payload any
	Source  WebsocketMessageSource
}

func (ws *WebsocketService) EmitEvent(args EmitEventArgs) error {
	marshalledPayload, err := json.Marshal(args.Payload)

	if err != nil {
		return err
	}

	message := WebsocketMessage{
		Type:      args.Event,
		Payload:   marshalledPayload,
		Timestamp: time.Now(),
		Source:    args.Source,
	}

	marshalledMessage, err := json.Marshal(message)
	if err != nil {
		return err
	}

	return ws.publishMessage(args.Topic, 0, string(marshalledMessage))
}

func (ws *WebsocketService) publishMessage(topic string, qos byte, payload string) error {
	if ws.Client == nil || !ws.Client.IsConnected() {
		return errors.New("cannot publish, client is not connected")
	}

	token := ws.Client.Publish(topic, qos, false, payload)

	if !token.WaitTimeout(1 * time.Second) {
		return errors.New("publish timed out")
	}

	if err := token.Error(); err != nil {
		return fmt.Errorf("failed to publish message: %w", err)
	}

	fmt.Printf("Published message to topic: %s\n", topic)
	return nil
}

func (ws *WebsocketService) IsConnected() bool {
	return ws.Client != nil && ws.Client.IsConnected()
}

func (ws *WebsocketService) CloseConnection() error {
	if ws.Client == nil || !ws.Client.IsConnected() {
		return errors.New("cannot close connection, client is not connected")
	}

	ws.Client.Disconnect(250)
	return nil
}

type StoreWebsocketHeartbeatArgs struct {
	ClientId  string
	Timestamp time.Time
	Payload   HeartbeatPayload
}

func (ws *WebsocketService) StoreWebsocketHeartbeat(ctx context.Context, args StoreWebsocketHeartbeatArgs) (*WebsocketHeartbeatRecord, error) {
	keys := WebsocketHeartbeatKeys{}
	return dynamo.PutItem(ws.DynamoTable, dynamo.PutItemArgs[WebsocketHeartbeatRecord]{
		Ctx: ctx,
		Item: WebsocketHeartbeatRecord{
			DynamoPrimaryKey: dynamo.DynamoPrimaryKey{
				PK: keys.PK(),
				SK: keys.SK(args.ClientId),
			},
			DynamoEntityType: dynamo.DynamoEntityType{
				EntityType: EntityTypeWebsocketHeartbeat,
			},
			Payload:   args.Payload,
			Timestamp: args.Timestamp,
		},
	})
}
