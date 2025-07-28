package app

import (
	"context"
	"lumi/api/app/globals"
	"lumi/api/app/routes"
	"lumi/api/app/utils"
	"lumi/pkg/dynamo"
	"lumi/pkg/models/relationship"
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

	globals.DynamoTable = &dynamo.DynamoTable{
		TableName:    tableName.(string),
		DynamoClient: dynamodb.NewFromConfig(cfg),
	}

	globals.S3Bucket = s3.NewBucket(s3.NewBucketArgs{
		BucketName: bucketName.(string),
		Config:     &cfg,
	})

	r := gin.Default()

	registerAllEndpoints(r)

	lambda := ginadapter.NewV2(r)
	return &App{
		Router:        r,
		LambdaAdapter: lambda,
	}
}

func registerAllEndpoints(router *gin.Engine) {
	for _, route := range getAllRoutes(router) {
		route.RegisterEndpoints()
	}
}

func getAllRoutes(router *gin.Engine) []routes.Route {
	dynamoTable, s3Bucket := globals.DynamoTable, globals.S3Bucket

	userService := user.NewUserService(dynamoTable, s3Bucket)
	relationshipService := relationship.NewRelationshipService(relationship.RelationshipServiceArgs{
		DynamoTable:   dynamoTable,
		UserService:   userService,
		StorageBucket: s3Bucket,
	})

	protectedGroup := utils.ProtectedRoute(router, "/")
	relationshipGroup := utils.RelationshipRoute(router, "/")

	userRoute := &routes.UserRoute{
		Router:         router,
		UserService:    userService,
		ProtectedGroup: protectedGroup,
	}

	relationshipRoute := &routes.RelationshipRoute{
		Router:              router,
		ProtectedGroup:      protectedGroup,
		RelationshipRoute:   relationshipGroup,
		UserService:         userService,
		RelationshipService: relationshipService,
	}

	return []routes.Route{userRoute, relationshipRoute}
}

func (app *App) Handler(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	utils.SetupJWKSCache(ctx)
	return app.LambdaAdapter.ProxyWithContext(ctx, req)
}
