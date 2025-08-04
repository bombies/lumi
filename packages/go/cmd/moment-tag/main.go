package main

import (
	"lumi/moment-tag/app"
	"lumi/moment-tag/globals"
	"lumi/pkg/constructs"

	"github.com/aws/aws-lambda-go/lambda"
)

var handlerApp *app.App

func init() {
	services, err := constructs.CreateConstructs(constructs.CreateConstructsArgs{
		Dynamo: true,
	})

	if err != nil {
		panic(err)
	}

	globals.DynamoTable = services.DynamoTable

	handlerApp = app.NewApp()
}

func main() {
	lambda.Start(handlerApp.Handler)
}
