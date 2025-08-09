package main

import (
	"lumi/pkg/constructs"
	"lumi/stream/app"
	"lumi/stream/globals"

	"github.com/aws/aws-lambda-go/lambda"
)

var streamHandlerApp *app.App

func init() {
	services, err := constructs.CreateConstructs(constructs.CreateConstructsArgs{
		Dynamo: true,
		S3:     true,
		Redis:  true,
	})

	if err != nil {
		panic(err)
	}

	globals.DynamoTable = services.DynamoTable
	globals.S3Bucket = services.S3Bucket
	globals.RedisClient = services.RedisClient

	streamHandlerApp = app.NewApp()
}

func main() {
	lambda.Start(streamHandlerApp.Handler)
}
