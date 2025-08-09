package main

import (
	"context"
	"log"
	"lumi/pkg/constructs"
	"lumi/pkg/dynamo"
	"lumi/pkg/websockets"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
)

var dynamoTable *dynamo.DynamoTable
var websocketService *websockets.WebsocketService
var logger *log.Logger

func init() {
	services, err := constructs.CreateConstructs(constructs.CreateConstructsArgs{
		Dynamo: true,
	})

	if err != nil {
		panic(err)
	}

	dynamoTable = services.DynamoTable
	websocketService = websockets.NewSocketService(dynamoTable)
	logger = log.New(os.Stdout, "websocket-heartbeat: ", log.LstdFlags)
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event websockets.TypedWebsocketMessage[websockets.HeartbeatPayload]) {
	if event.Type != websockets.WebsocketEventHeartbeat {
		return
	}

	logger.Printf("Received a heartbeat from %s (%s)", event.Payload.UserID, time.Now().Format(time.RFC3339))
	_, err := websocketService.StoreWebsocketHeartbeat(ctx, websockets.StoreWebsocketHeartbeatArgs{
		ClientId:  event.Payload.UserID,
		Timestamp: event.Timestamp,
		Payload:   event.Payload,
	})

	if err != nil {
		logger.Printf("Error storing heartbeat: %s", err)
	} else {
		logger.Printf("Stored heartbeat for %s", event.Payload.UserID)
	}
}
