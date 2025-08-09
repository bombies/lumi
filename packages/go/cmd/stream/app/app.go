package app

import (
	"context"
	"log"
	"lumi/pkg/models/affirmation"
	"lumi/pkg/models/moment"
	"lumi/pkg/models/notification"
	"lumi/pkg/models/relationship"
	songrecommendation "lumi/pkg/models/song-recommendation"
	"lumi/pkg/models/user"
	"lumi/stream/globals"
	"os"

	"github.com/aws/aws-lambda-go/events"
)

type App struct {
	Logger *log.Logger
}

func NewApp() *App {
	logger := log.New(os.Stdout, "dynamo-stream-handler: ", log.LstdFlags)

	return &App{
		Logger: logger,
	}
}

func (app *App) Handler(ctx context.Context, event events.DynamoDBEvent) {
	dynamoTable, s3Bucket, redisClient := globals.DynamoTable, globals.S3Bucket, globals.RedisClient

	momentService := moment.NewMomentService(moment.MomentServiceArgs{
		DynamoTable:   dynamoTable,
		StorageBucket: s3Bucket,
		RedisClient:   redisClient,
	})

	affirmationsService := affirmation.NewAffirmationService(affirmation.AffirmationServiceArgs{
		DynamoTable: dynamoTable,
		RelationshipService: relationship.NewRelationshipService(relationship.RelationshipServiceArgs{
			DynamoTable:   dynamoTable,
			UserService:   user.NewUserService(dynamoTable, s3Bucket),
			StorageBucket: s3Bucket,
		}),
	})

	notificationsService := notification.NewNotificationService(dynamoTable)

	songRecommendationService := songrecommendation.NewSongRecommendationService(dynamoTable)

	for _, record := range event.Records {
		if record.EventName == "" || record.Change.Keys == nil {
			continue
		}

		keyMap := record.Change.Keys
		pk, ok := keyMap["pk"]

		if !ok {
			app.Logger.Println("Received an event with a missing pk value value. Skipping...")
			continue
		}

		sk, ok := keyMap["sk"]

		if !ok {
			app.Logger.Println("Received an event with a missing sk value value. Skipping...")
			continue
		}

		pkString, skString := pk.String(), sk.String()

		if pkString == "" || skString == "" {
			app.Logger.Println("Received an event with a missing pk or sk value value. Skipping...")
			continue
		}

		app.Logger.Printf("Now handling a %s DynamoDB stream event. (%s, %s)\n", record.EventName, pkString, skString)
		switch record.EventName {
		case "REMOVE":
			oldImage := record.Change.OldImage

			if oldImage == nil {
				app.Logger.Println("Received a REMOVE event with a missing oldImage value. Skipping...")
				continue
			}

			relationshipId, partner1Id, partner2Id := oldImage["id"].String(), oldImage["partner1"].String(), oldImage["partner2"].String()
			_, err := affirmationsService.DeleteAffirmationsForRelationship(ctx, relationshipId)

			if err != nil {
				app.Logger.Printf("Error deleting affirmations for relationship %s: %v\n", relationshipId, err)
			}

			_, err = momentService.DeleteMomentDetailsForRelationship(ctx, relationshipId)

			if err != nil {
				app.Logger.Printf("Error deleting moment details for relationship %s: %v\n", relationshipId, err)
			}

			_, err = songRecommendationService.DeleteSongRecommendationsByRelationshipId(ctx, relationshipId)

			if err != nil {
				app.Logger.Printf("Error deleting song recommendations for relationship %s: %v\n", relationshipId, err)
			}

			_, err = notificationsService.DeleteNotificationsForUser(ctx, partner1Id)

			if err != nil {
				app.Logger.Printf("Error deleting notifications for user %s: %v\n", partner1Id, err)
			}

			_, err = notificationsService.DeleteNotificationsForUser(ctx, partner2Id)

			if err != nil {
				app.Logger.Printf("Error deleting notifications for user %s: %v\n", partner2Id, err)
			}
		}
	}
}
