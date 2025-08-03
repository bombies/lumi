package app

import (
	"context"
	"log"
	"lumi/moment-deletion/globals"
	"lumi/pkg/dynamo"
	"lumi/pkg/models/moment"
	"lumi/pkg/s3"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/samber/lo"
)

type App struct {
	Logger *log.Logger
}

func NewApp() *App {
	logger := log.New(os.Stdout, "moment-deletion-handler: ", log.LstdFlags)
	return &App{
		Logger: logger,
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

		momentId := oldImage["id"].String()
		app.Logger.Printf("Moment with ID %s was deleted. Now performing cleanup...", momentId)

		momentMessageKeys := moment.MomentMessageKeys{}
		relatedMessageRecords, err := dynamo.GetItems(
			globals.DynamoTable,
			dynamo.GetItemsParams[moment.MomentMessageRecord]{
				Ctx:   ctx,
				Index: lo.ToPtr(dynamo.GSI1),
				QueryExpression: dynamo.DynamoQueryExpression{
					Expression: "#gsi1pk = :gsi1sk",
					Variables: map[string]any{
						":gsi1pk": momentMessageKeys.GSI1PK(momentId),
					},
				},
				Exhaustive: lo.ToPtr(true),
			},
		)

		if err != nil {
			app.Logger.Printf("Error getting related message records: %v", err)
			continue
		}

		momentTagKeys := moment.MomentTagKeys{}
		relatedTagRecords, err := dynamo.GetItems(
			globals.DynamoTable,
			dynamo.GetItemsParams[moment.RelationshipMomentTagRecord]{
				QueryExpression: dynamo.DynamoQueryExpression{
					Expression: "#pk = :pk",
					Variables: map[string]any{
						":pk": momentTagKeys.PK(momentId),
					},
				},
				Exhaustive: lo.ToPtr(true),
			},
		)

		if err != nil {
			app.Logger.Printf("Error getting related tag records: %v", err)
			continue
		}

		app.Logger.Printf(
			"Deleting %v related message records and %v tag records...",
			len(relatedMessageRecords.Data),
			len(relatedTagRecords.Data),
		)

		aggregatedData := make([]dynamo.DynamoRecord, 0)

		relatedMessagesDynamoRecords := lo.Map(
			relatedMessageRecords.Data,
			func(record moment.MomentMessageRecord, _ int) dynamo.DynamoRecord {
				return record
			},
		)

		relatedTagDynamoRecords := lo.Map(
			relatedTagRecords.Data,
			func(record moment.RelationshipMomentTagRecord, _ int) dynamo.DynamoRecord {
				return record
			},
		)

		aggregatedData = append(aggregatedData, relatedMessagesDynamoRecords...)
		aggregatedData = append(aggregatedData, relatedTagDynamoRecords...)

		if len(aggregatedData) > 0 {
			args := lo.Map(
				aggregatedData,
				func(record dynamo.DynamoRecord, _ int) dynamo.BatchWriteItemsArgs {
					return dynamo.BatchWriteItemsArgs{
						Delete: &dynamo.WriteDeleteArgs{
							PK: record.GetPK(),
							SK: record.GetSK(),
						},
					}
				},
			)

			dynamo.BatchWriteItems(
				globals.DynamoTable,
				ctx,
				args...,
			)
		}

		// Delete the video from S3
		relationshipId := oldImage["relationshipId"].String()
		rawObjectKey := oldImage["objectKey"].String()
		rawThumbailObjectKey, thumbnailExists := oldImage["thumbnailObjectKey"]

		objectKey, err := s3.ContentPathsRelationshipMoments(relationshipId, rawObjectKey)
		if err != nil {
			app.Logger.Printf("Error getting object key: %v", err)
			continue
		}

		_, err = globals.S3Bucket.DeleteObject(ctx, objectKey)

		if err != nil {
			app.Logger.Printf("Error deleting object: %v", err)
			continue
		}

		if !thumbnailExists {
			thumbnailObjectKey, err := s3.ContentPathsRelationshipMoments(relationshipId, rawThumbailObjectKey.String())
			if err != nil {
				app.Logger.Printf("Error getting thumbnail object key: %v", err)
				continue
			}

			_, err = globals.S3Bucket.DeleteObject(ctx, thumbnailObjectKey)
		}

		app.Logger.Println("Deleted the video from S3!")
	}
}
