package main

import (
	"lumi/moment-deletion/app"
	"lumi/moment-deletion/globals"
	"lumi/pkg/constructs"

	"github.com/aws/aws-lambda-go/lambda"
)

var momentDeletionApp *app.App

func init() {
	services, err := constructs.CreateConstructs(constructs.CreateConstructsArgs{
		Dynamo: true,
		S3:     true,
	})

	if err != nil {
		panic(err)
	}

	globals.DynamoTable = services.DynamoTable
	globals.S3Bucket = services.S3Bucket

	momentDeletionApp = app.NewApp()
}

func main() {
	lambda.Start(momentDeletionApp.Handler)
}
