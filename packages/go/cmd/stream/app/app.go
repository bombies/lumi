package app

import (
	"context"
	"log"
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
			// TODO: Handle record removals
		}
	}
}
