package main

import (
	"lumi/affirmation-aggregator/app"
	"lumi/affirmation-aggregator/globals"
	"lumi/pkg/constructs"

	"github.com/aws/aws-lambda-go/lambda"
)

var handlerApp *app.App

func init() {
	services, err := constructs.CreateConstructs(constructs.CreateConstructsArgs{
		Dynamo: true,
		SQS:    true,
	})

	if err != nil {
		panic(err)
	}

	globals.DynamoTable = services.DynamoTable
	globals.SQSClient = services.SQSClient

	handlerApp = app.NewApp()
}

func main() {
	lambda.Start(handlerApp.Handler)
}
