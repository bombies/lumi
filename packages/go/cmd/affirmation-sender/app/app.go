package app

import (
	"context"
	"log"
	"lumi/affirmation-sender/globals"
	"lumi/pkg/models/affirmation"
	"lumi/pkg/models/notification"
	"lumi/pkg/models/relationship"
	"lumi/pkg/models/user"
	"lumi/pkg/websockets"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/samber/lo"
)

type App struct {
	AffirmationService  *affirmation.AffirmationService
	RelationshipService *relationship.RelationshipService
	UserService         *user.UserService
	Logger              *log.Logger
}

func NewApp() *App {
	dynamoTable := globals.DynamoTable

	userService := user.NewUserService(dynamoTable, nil)

	relationshipService := relationship.NewRelationshipService(relationship.RelationshipServiceArgs{
		DynamoTable: dynamoTable,
		UserService: userService,
	})

	affirmationService := affirmation.NewAffirmationService(affirmation.AffirmationServiceArgs{
		DynamoTable:         dynamoTable,
		RelationshipService: relationshipService,
		WebsocketService:    websockets.NewSocketService(dynamoTable),
		NotificationService: notification.NewNotificationService(dynamoTable),
	})

	logger := log.New(os.Stdout, "affirmation-sender: ", log.LstdFlags)

	return &App{
		AffirmationService:  affirmationService,
		RelationshipService: relationshipService,
		UserService:         userService,
		Logger:              logger,
	}
}

func (app *App) Handler(ctx context.Context, event events.SQSEvent) {
	app.Logger.Println("Processing affirmation notification event...")

	relationshipId := event.Records[0].Body
	relationship, err := app.RelationshipService.GetRelationshipById(ctx, relationshipId)

	if err != nil {
		app.Logger.Printf("Error getting relationship: %v\n", err)
		return
	}

	partner1, err := app.UserService.GetNonNilUserById(ctx, user.GetUserByIdArgs{
		UserId: relationship.Partner1,
	})

	if err != nil {
		app.Logger.Printf("Error getting partner1: %v\n", err)
		return
	}

	partner2, err := app.UserService.GetNonNilUserById(ctx, user.GetUserByIdArgs{
		UserId: relationship.Partner2,
	})

	if err != nil {
		app.Logger.Printf("Error getting partner2: %v\n", err)
		return
	}

	handleNotifications := func(u user.UserRecord) {
		aff, err := app.AffirmationService.SelectAffirmation(ctx, u.Id)

		if err != nil {
			app.Logger.Printf("Error selecting affirmation: %v\n", err)
			return
		}

		_, err = app.AffirmationService.SendAffirmationToUser(
			ctx,
			u,
			affirmation.SendCustomAffirmationDto{
				Affirmation: aff.Affirmation,
			},
			affirmation.SendAffirmationToUserOpts{
				Partner: lo.Ternary(u.Id == partner1.Id, partner2, partner1),
			},
		)

		if err != nil {
			app.Logger.Printf("Error sending affirmation: %v\n", err)
			return
		}
	}

	handleNotifications(*partner1)
	handleNotifications(*partner2)

	app.Logger.Println("All done!")
}
