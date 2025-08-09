package main

import (
	"context"
	"log"
	"lumi/api/app"
	"lumi/api/app/globals"
	"lumi/api/app/utils"
	"lumi/pkg/constructs"

	"github.com/aws/aws-lambda-go/lambda"
)

var api *app.App

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
	globals.RedisClient = services.RedisClient
	globals.S3Bucket = services.S3Bucket

	backgroundContext := context.Background()
	utils.SetupJWKSCache(backgroundContext)
	log.Printf("Initialized JWKs cache!\n")

	api = app.NewApp()
}

func main() {
	lambda.Start(api.Handler)
}
