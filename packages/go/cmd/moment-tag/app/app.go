package app

import (
	"context"
	"fmt"
	"log"
	"lumi/moment-tag/globals"
	"lumi/pkg/dynamo"
	"lumi/pkg/models/moment"
	"os"

	"github.com/aws/aws-lambda-go/events"
)

type App struct {
	Logger        *log.Logger
	MomentService *moment.MomentService
}

func NewApp() *App {
	logger := log.New(os.Stdout, "moment-tag-handler: ", log.LstdFlags)
	return &App{
		Logger: logger,
		MomentService: moment.NewMomentService(moment.MomentServiceArgs{
			DynamoTable: globals.DynamoTable,
		}),
	}
}

func (app *App) Handler(ctx context.Context, event events.DynamoDBEvent) {
	for _, record := range event.Records {
		if record.EventName == "" || record.Change.Keys == nil {
			continue
		}

		pk, sk := record.Change.Keys["PK"].String(), record.Change.Keys["SK"].String()

		if pk == "" || sk == "" {
			continue
		}

		switch record.EventName {
		case "REMOVE":
			oldImage := record.Change.OldImage
			if oldImage == nil {
				app.Logger.Println("Old image is missing for REMOVE event")
				continue
			}

			relationshipId := oldImage["relationshipId"].String()
			tag := oldImage["tag"].String()
			err := app.updateRelationshipMomentTag(ctx, relationshipId, tag, -1)

			if err != nil {
				app.Logger.Printf("Failed to update relationship moment tag: %v", err)
			}
		case "INSERT":
			newImage := record.Change.NewImage
			if newImage == nil {
				app.Logger.Println("New image is missing for INSERT event")
				continue
			}

			relationshipId := newImage["relationshipId"].String()
			tag := newImage["tag"].String()
			err := app.updateRelationshipMomentTag(ctx, relationshipId, tag, 1)

			if err != nil {
				app.Logger.Printf("Failed to update relationship moment tag: %v", err)
			}
		}
	}
}

func (app *App) updateRelationshipMomentTag(ctx context.Context, relationshipId, tag string, countDelta int) error {
	relationshipMomentTag, err := app.MomentService.GetRelationshipMomentTag(ctx, relationshipId, tag)

	if err != nil {
		return err
	}

	if relationshipMomentTag == nil {
		app.Logger.Printf("relationship tag %s#%s doesn't exist, skipping update", relationshipId, tag)
		return nil
	}

	app.Logger.Printf("Updating relationship moment tag for %s#%s (%v)", relationshipId, tag, countDelta)

	keys := moment.RelationshipMomentTagKeys{}
	_, err = dynamo.UpdateItem[moment.RelationshipMomentTagRecord](
		globals.DynamoTable,
		dynamo.UpdateItemArgs{
			Ctx: ctx,
			PK:  keys.PK(relationshipId),
			SK:  keys.SK(tag),
			UpdateBody: moment.UpdateableRelationshipMomentTagRecord{
				AssociationCount: dynamo.NewUpdateValue(relationshipMomentTag.AssociationCount + countDelta),
			},
		},
	)

	if err != nil {
		return fmt.Errorf("failed to update relationship moment tag: %w", err)
	}

	app.Logger.Println("Successfully updated the relationship moment tag!")
	return nil
}
