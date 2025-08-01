package main

import (
	"context"
	"log"
	"lumi/pkg/dynamo"
	"lumi/pkg/redis"
	"lumi/pkg/s3"
	"lumi/stream/app"
	"lumi/stream/globals"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/sst/sst/v3/sdk/golang/resource"
)

var streamHandlerApp *app.App

func init() {
	cfg, err := config.LoadDefaultConfig(context.TODO())

	if err != nil {
		panic(err)
	}

	tableName, err := resource.Get("Database", "name")

	if err != nil {
		panic(err)
	}

	bucketName, err := resource.Get("ContentBucket", "name")

	if err != nil {
		panic(err)
	}

	globals.DynamoTable = &dynamo.DynamoTable{
		TableName:    tableName.(string),
		DynamoClient: dynamodb.NewFromConfig(cfg),
	}
	log.Printf("Initialized Dynamo client for %s!\n", globals.DynamoTable.TableName)

	globals.S3Bucket = s3.NewBucket(s3.NewBucketArgs{
		BucketName: bucketName.(string),
		Config:     &cfg,
	})
	log.Printf("Initialized S3 client for %s!\n", globals.S3Bucket.BucketName)

	globals.RedisClient = redis.NewRedisClient()
	log.Printf("Initialized Redis client!\n")

	streamHandlerApp = app.NewApp()
}

func main() {
	lambda.Start(streamHandlerApp.Handler)
}
