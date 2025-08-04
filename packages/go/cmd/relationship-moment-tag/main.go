package main

import (
	"lumi/pkg/constructs"
	"lumi/relationship-moment-tag/app"
	"lumi/relationship-moment-tag/globals"

	"github.com/aws/aws-lambda-go/lambda"
)

var handlerApp *app.App

func init() {
	services, err := constructs.CreateConstructs(constructs.CreateConstructsArgs{
		S3:     true,
		Dynamo: true,
	})

	if err != nil {
		panic(err)
	}

	globals.DynamoTable = services.DynamoTable
	globals.S3Bucket = services.S3Bucket
}

func main() {
	lambda.Start(handlerApp.Handler)
}
