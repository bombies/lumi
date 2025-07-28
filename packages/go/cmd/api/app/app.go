package app

import (
	"context"
	"lumi/api/app/globals"
	"lumi/api/app/routes"
	"lumi/api/app/utils"
	"lumi/pkg/models/moment"
	"lumi/pkg/models/relationship"
	"lumi/pkg/models/user"
	"net/http"

	"github.com/aws/aws-lambda-go/events"
	ginadapter "github.com/awslabs/aws-lambda-go-api-proxy/gin"
	"github.com/gin-gonic/gin"
)

type App struct {
	Router        *gin.Engine
	LambdaAdapter *ginadapter.GinLambdaV2
}

func NewApp() *App {
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

	router.GET("/health", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, gin.H{
			"status": "healthy",
		})
	})
}

func getAllRoutes(router *gin.Engine) []routes.Route {
	dynamoTable, s3Bucket, redisClient := globals.DynamoTable, globals.S3Bucket, globals.RedisClient

	userService := user.NewUserService(dynamoTable, s3Bucket)
	relationshipService := relationship.NewRelationshipService(relationship.RelationshipServiceArgs{
		DynamoTable:   dynamoTable,
		UserService:   userService,
		StorageBucket: s3Bucket,
	})
	momentService := moment.NewMomentService(moment.MomentServiceArgs{
		DynamoTable:   dynamoTable,
		StorageBucket: s3Bucket,
		RedisClient:   redisClient,
	})

	protectedGroup := utils.ProtectedRoute(router, "/")
	relationshipGroup := utils.RelationshipRoute(router, "/")

	userRoute := &routes.UserRoute{
		Router:         router,
		UserService:    userService,
		ProtectedGroup: protectedGroup,
	}

	relationshipRoute := &routes.RelationshipRoute{
		ProtectedGroup:      protectedGroup,
		RelationshipRoute:   relationshipGroup,
		UserService:         userService,
		RelationshipService: relationshipService,
	}

	momentRoute := &routes.MomentRoute{
		RelationshipRoute: relationshipGroup,
		MomentService:     momentService,
	}

	return []routes.Route{
		userRoute,
		relationshipRoute,
		momentRoute,
	}
}

func (app *App) Handler(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	return app.LambdaAdapter.ProxyWithContext(ctx, req)
}
