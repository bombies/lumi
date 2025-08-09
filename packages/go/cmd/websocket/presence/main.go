package main

import (
	"context"
	"log"
	"lumi/pkg/constructs"
	"lumi/pkg/dynamo"
	"lumi/pkg/models/user"
	"lumi/pkg/websockets"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
)

var dynamoTable *dynamo.DynamoTable
var userService *user.UserService
var logger *log.Logger

func init() {
	services, err := constructs.CreateConstructs(constructs.CreateConstructsArgs{
		Dynamo: true,
	})

	if err != nil {
		panic(err)
	}

	dynamoTable = services.DynamoTable
	userService = user.NewUserService(dynamoTable, nil)
	logger = log.New(os.Stdout, "websocket-presence: ", log.LstdFlags)
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event websockets.TypedWebsocketMessage[websockets.PresencePayload]) {
	if event.Type != websockets.WebsocketEventPresence {
		return
	}

	logger.Printf("Received presence event from %s. (%s)", event.Payload.Username, event.Payload.Status)
	_, err := userService.UpdateUser(ctx, event.Payload.UserID, user.UpdateUserDto{
		Status: &event.Payload.Status,
	})

	if err != nil {
		logger.Printf("Error updating user: %s", err)
	} else {
		logger.Printf("Successfully updated user %s", event.Payload.Username)
	}
}
