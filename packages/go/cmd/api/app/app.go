package app

import (
	"context"
	"lumi/api/app/routes"
	"lumi/api/app/utils"
	"lumi/pkg/dynamo"
	"lumi/pkg/models/user"
	"lumi/pkg/s3"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	ginadapter "github.com/awslabs/aws-lambda-go-api-proxy/gin"
	"github.com/gin-gonic/gin"
	"github.com/sst/sst/v3/sdk/golang/resource"
)

type App struct {
	Router        *gin.Engine
	LambdaAdapter *ginadapter.GinLambdaV2
}

func NewApp() *App {
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

	dynamoTable := dynamo.DynamoTable{
		TableName:    tableName.(string),
		DynamoClient: dynamodb.NewFromConfig(cfg),
	}

	s3Bucket := s3.NewBucket(s3.NewBucketArgs{
		BucketName: bucketName.(string),
		Config:     &cfg,
	})

	r := gin.Default()

	registerAllEndpoints(r, &dynamoTable, s3Bucket)

	lambda := ginadapter.NewV2(r)
	return &App{
		Router:        r,
		LambdaAdapter: lambda,
	}
}

func registerAllEndpoints(router *gin.Engine, table *dynamo.DynamoTable, bucket *s3.S3Bucket) {
	userService := user.NewUserService(table, bucket)

	userRoute := &routes.UserRoute{
		Router:         router,
		UserService:    userService,
		ProtectedGroup: utils.ProtectedRoute(router, "/users"),
	}
	userRoute.RegisterEndpoints()
}

func (app *App) Handler(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	utils.SetupJWKSCache(ctx)
	return app.LambdaAdapter.ProxyWithContext(ctx, req)
}
