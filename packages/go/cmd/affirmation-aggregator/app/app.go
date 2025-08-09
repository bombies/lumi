package app

import (
	"context"
	"log"
	"lumi/affirmation-aggregator/globals"
	"lumi/pkg/datastructures"
	"lumi/pkg/dynamo"
	"lumi/pkg/models/affirmation"
	"lumi/pkg/utils"
	"os"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/samber/lo"
)

type App struct {
	Logger *log.Logger
}

func NewApp() *App {
	logger := log.New(os.Stdout, "affirmation-aggregator: ", log.LstdFlags)
	return &App{
		Logger: logger,
	}
}

func (app *App) Handler(ctx context.Context) {
	relationshipIds := datastructures.NewSet()
	params := dynamodb.ScanInput{
		TableName:        &globals.DynamoTable.TableName,
		FilterExpression: lo.ToPtr("begins_with(#pk, :pk)"),
		ExpressionAttributeNames: map[string]string{
			"#pk": "pk",
		},
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":pk": &types.AttributeValueMemberS{
				Value: affirmation.AffirmationKeys{}.BuildKey(),
			},
		},
	}

	affirmations, err := dynamo.ScanWithPaginationExhaustion(dynamo.ScanWithPaginationExhaustionArgs[affirmation.AffirmationRecord]{
		Table:  globals.DynamoTable,
		Ctx:    ctx,
		Params: &params,
	})

	if err != nil {
		app.Logger.Println("Error scanning dynamo table:", err)
		return
	}

	for _, affirmation := range affirmations {
		relationshipIds.Add(affirmation.RelationshipId)
	}

	app.Logger.Printf("Queueing affirmation notifications for %v relationships", relationshipIds.Size())

	results := utils.FanOut(utils.FanOutArgs[string, any]{
		Items:       relationshipIds.List(),
		WorkerCount: relationshipIds.Size(),
		WorkerCallback: func(workerId int, jobs <-chan string, results chan<- utils.FanOutJobResult[any]) {
			for relationshipId := range jobs {
				app.Logger.Printf("Worker %v: Queueing affirmations for %v", workerId, relationshipId)
				err := globals.SQSClient.SendMessage(ctx, relationshipId)

				if err != nil {
					results <- utils.FanOutJobResult[any]{
						Err: err,
					}
					continue
				}

				results <- utils.FanOutJobResult[any]{}
			}
		},
	})

	for _, err := range results.Errors {
		app.Logger.Println("Error queueing affirmations:", err)
	}

	app.Logger.Printf("Successfully queued affirmations for %v relationships!", len(results.Results))
}
