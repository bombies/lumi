package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"lumi/pkg/constructs"
	"lumi/pkg/dynamo"
	"lumi/pkg/models/notification"
	"lumi/pkg/models/relationship"
	"lumi/pkg/models/user"
	"lumi/pkg/websockets"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/samber/lo"
)

var dynamoTable *dynamo.DynamoTable
var userService *user.UserService
var relationshipService *relationship.RelationshipService
var notificationService *notification.NotificationService
var ws *websockets.WebsocketService
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
	relationshipService = relationship.NewRelationshipService(relationship.RelationshipServiceArgs{
		DynamoTable: dynamoTable,
		UserService: userService,
	})
	notificationService = notification.NewNotificationService(dynamoTable)
	ws = websockets.NewSocketService(dynamoTable)
	logger = log.New(os.Stdout, "cron-anniversaries-sender: ", log.LstdFlags)
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event events.SQSEvent) {
	logger.Println("Processing anniversdary notification event...")

	var relationship relationship.RelationshipRecord
	if err := json.Unmarshal([]byte(event.Records[0].Body), &relationship); err != nil {
		logger.Printf("Error unmarshalling event: %v", err)
		return
	}

	logger.Println("Connected to websocket! Now sending out notifications...")

	partner1, err := userService.GetUserById(ctx, user.GetUserByIdArgs{
		UserId: relationship.Partner1,
	})

	if err != nil {
		logger.Printf("Error getting partner 1: %v", err)
		return
	}

	partner2, err := userService.GetUserById(ctx, user.GetUserByIdArgs{
		UserId: relationship.Partner2,
	})

	if err != nil {
		logger.Printf("Error getting partner 2: %v", err)
		return
	}

	handleNotifications := func(u user.UserRecord) {
		partner := lo.Ternary(partner1 != nil && u.Id == partner1.Id, partner2, partner1)

		if partner == nil {
			logger.Printf("Could not determine partner for user: %v", u.Username)
			return
		}

		notificationService.SendNotification(ctx, notification.SendNotificationArgs{
			User: u,
			Payload: notification.NotificationPayload{
				Title: "Happy Anniversary!",
				Body:  fmt.Sprintf("Today is your anniversary with %s! Send them a really long lovey-dovey message today and show them all the love. 💘", partner.FirstName),
			},
		}, notification.SendNotificationOpts{
			OnlineWebSocketMessage: &notification.OnlineWebSocketMessageArgs{
				MqttConnection: ws,
				Topic:          fmt.Sprintf("%s/%s/notifications", os.Getenv("NOTIFICATIONS_TOPIC"), u.Id),
			},
		})
	}

	if err = ws.OpenConnection(); err != nil {
		logger.Printf("Error opening websocket connection: %v", err)
		return
	}
	defer ws.CloseConnection()

	if partner1 != nil {
		handleNotifications(*partner1)
	}

	if partner2 != nil {
		handleNotifications(*partner2)
	}

	logger.Println("All done!")
}
