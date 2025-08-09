package main

import (
	"context"
	"log"
	"lumi/pkg/constructs"
	"lumi/pkg/dynamo"
	"lumi/pkg/models/relationship"
	"lumi/pkg/sqs"
	"lumi/pkg/utils"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
)

var dynamoTable *dynamo.DynamoTable
var sqsClient *sqs.SQSClient
var relationshipService *relationship.RelationshipService
var logger *log.Logger

func init() {
	services, err := constructs.CreateConstructs(constructs.CreateConstructsArgs{
		Dynamo: true,
		SQS:    true,
	})

	if err != nil {
		panic(err)
	}

	dynamoTable = services.DynamoTable
	relationshipService = relationship.NewRelationshipService(relationship.RelationshipServiceArgs{
		DynamoTable: dynamoTable,
	})
	logger = log.New(os.Stdout, "cron-anniversaries-aggregator: ", log.LstdFlags)
	sqsClient = services.SQSClient
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context) {
	logger.Println("Checking for any anniversaries today...")

	relationships, err := relationshipService.GetAnniversaryRelationships(ctx, time.Now())
	if err != nil {
		logger.Println("Error getting anniversaries:", err)
		return
	}

	logger.Printf("Queueing affirmation notifications for %v relationships...", len(relationships))

	results := utils.FanOut(utils.FanOutArgs[relationship.RelationshipRecord, any]{
		Items:       relationships,
		WorkerCount: len(relationships),
		WorkerCallback: func(workerId int, jobs <-chan relationship.RelationshipRecord, results chan<- utils.FanOutJobResult[any]) {
			for relationship := range jobs {
				logger.Printf("Worker %v: Queueing affirmations for %v", workerId, relationship.Id)
				err := sqsClient.SendMessage(ctx, relationship)

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
		logger.Println("Error queueing affirmations:", err)
	}

	logger.Printf("Successfully queued affirmations for %v relationships!", len(results.Results))
}
