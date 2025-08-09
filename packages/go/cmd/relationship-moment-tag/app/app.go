package app

import (
	"context"
	"log"
	"lumi/pkg/dynamo"
	"lumi/pkg/models/moment"
	"lumi/relationship-moment-tag/globals"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/samber/lo"
)

type App struct {
	Logger        *log.Logger
	MomentService *moment.MomentService
}

func NewApp() *App {
	logger := log.New(os.Stdout, "relationship-moment-tag-handler: ", log.LstdFlags)
	return &App{
		Logger: logger,
		MomentService: moment.NewMomentService(moment.MomentServiceArgs{
			DynamoTable:   globals.DynamoTable,
			StorageBucket: globals.S3Bucket,
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

		oldImage := record.Change.OldImage
		if oldImage == nil {
			continue
		}

		relationshipId := oldImage["relationshipId"].String()
		tag := oldImage["tag"].String()

		app.Logger.Printf("Deleting related tags for relationship moment tag %s#%s\n", relationshipId, tag)

		momentTags, err := app.MomentService.GetMomentTagsForRelationshipTag(ctx, relationshipId, tag)

		if err != nil {
			app.Logger.Printf("Error getting related tags for relationship moment tag %s#%s: %s\n", relationshipId, tag, err)
			continue
		}

		app.Logger.Printf("Found %d related tags for relationship moment tag %s#%s. Deleting them all...\n", len(momentTags), relationshipId, tag)

		keys := lo.Map(
			momentTags,
			func(momentTag moment.MomentTagRecord, _ int) dynamo.DynamoPrimaryKey {
				return dynamo.DynamoPrimaryKey{
					PK: momentTag.PK,
					SK: momentTag.SK,
				}
			},
		)

		dynamo.DeleteManyItems(
			globals.DynamoTable,
			ctx,
			keys,
		)

		app.Logger.Println("Deleted all related tags.")
	}
}
