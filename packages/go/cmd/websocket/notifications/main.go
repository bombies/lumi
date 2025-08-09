package main

import (
	"context"
	"log"
	"lumi/pkg/constructs"
	"lumi/pkg/dynamo"
	"lumi/pkg/models/notification"
	"lumi/pkg/models/user"
	"lumi/pkg/websockets"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
)

var dynamoTable *dynamo.DynamoTable
var userService *user.UserService
var notificationService *notification.NotificationService
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
	notificationService = notification.NewNotificationService(dynamoTable)
	logger = log.New(os.Stdout, "websocket-notifications: ", log.LstdFlags)
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event websockets.TypedWebsocketMessage[websockets.NotificationPayload]) {
	if event.Source != websockets.WebsocketMessageSourceClient || event.Type != websockets.WebsocketEventNotification {
		return
	}

	payload := event.Payload
	user, err := userService.GetUserById(ctx, user.GetUserByIdArgs{
		UserId: payload.ReceiverID,
	})

	if err != nil {
		logger.Printf("Error getting user: %v\n", err)
		return
	}

	if user == nil {
		logger.Printf("User %s not found", payload.ReceiverID)
		return
	}

	logger.Printf("Received a notification message for %s, now attempting to send it out through webpush...\n", user.Username)
	_, err = notificationService.SendNotification(ctx, notification.SendNotificationArgs{
		User: *user,
		Payload: notification.NotificationPayload{
			Title:    payload.Message.Title,
			Body:     payload.Message.Content,
			OpenUrl:  &payload.Message.OpenUrl,
			Metadata: payload.Metadata,
		},
	})

	if err != nil {
		logger.Printf("Error sending notification: %v\n", err)
		return
	}

	logger.Println("All done!")
}
