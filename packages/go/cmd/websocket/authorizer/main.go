package main

import (
	"context"
	"fmt"
	"log"
	"lumi/pkg/constructs"
	"lumi/pkg/dynamo"
	"lumi/pkg/models/relationship"
	"lumi/pkg/websockets"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-lambda-go/lambdacontext"
	"github.com/samber/lo"
)

var dynamoTable *dynamo.DynamoTable
var logger *log.Logger
var relationshipService *relationship.RelationshipService

func init() {
	services, err := constructs.CreateConstructs(constructs.CreateConstructsArgs{
		Dynamo: true,
	})

	if err != nil {
		panic(err)
	}

	dynamoTable = services.DynamoTable

	logger = log.New(os.Stdout, "websocket-authorizer: ", log.LstdFlags)
	relationshipService = relationship.NewRelationshipService(relationship.RelationshipServiceArgs{
		DynamoTable: dynamoTable,
	})
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event events.IoTCoreCustomAuthorizerRequest) (events.IoTCoreCustomAuthorizerResponse, error) {
	logger.Println("test")

	lc, ok := lambdacontext.FromContext(ctx)
	if !ok {
		logger.Println("failed to get lambda context")
		return denyResponse("internal-error"), nil
	}

	arnSplit := strings.Split(lc.InvokedFunctionArn, ":")
	partition, region, accountId := arnSplit[1], arnSplit[3], arnSplit[4]

	token := string(event.ProtocolData.MQTT.Password)
	allowedPaths, err := authorize(ctx, token)
	if err != nil {
		logger.Println("failed to authorize", err)
		return denyResponse(event.ProtocolData.MQTT.Username), nil
	}

	logger.Printf("Authorizing %s\n\tAllowed subscription topics: %v\n\tAllowed publishing topics: %v\n", token, allowedPaths.Subscribe, allowedPaths.Publish)

	return events.IoTCoreCustomAuthorizerResponse{
		IsAuthenticated: true,
		PrincipalID: lo.Ternary(
			event.ProtocolData.MQTT.Username != "",
			event.ProtocolData.MQTT.Username,
			time.Now().Format(time.RFC3339),
		),
		DisconnectAfterInSeconds: 86400,
		RefreshAfterInSeconds:    300,
		PolicyDocuments: []*events.IAMPolicyDocument{
			buildPolicy(BuildPolicyArgs{
				Partition:    partition,
				Region:       region,
				AccountId:    accountId,
				AllowedPaths: allowedPaths,
				ClientId:     event.ProtocolData.MQTT.ClientID,
			}),
		},
	}, nil
}

type AllowedPaths struct {
	Subscribe []string `json:"subscribe"`
	Publish   []string `json:"publish"`
}

func authorize(ctx context.Context, token string) (AllowedPaths, error) {
	notificationsTopic := os.Getenv("NOTIFICATIONS_TOPIC")

	parts := strings.Split(token, "::")
	if len(parts) != 3 {
		return AllowedPaths{}, fmt.Errorf("invalid token format: expected 3 parts, got %d", len(parts))
	}
	clientID, identifier, args := parts[0], parts[1], parts[2]

	var paths AllowedPaths

	switch websockets.WebsocketToken(identifier) {
	case websockets.WebsocketTokenRelationshipUser:
		allowedSubscriptionChannels := []string{
			fmt.Sprintf("%s/%s/%s", notificationsTopic, websockets.WebsocketSubTopicRelationship, args),
			fmt.Sprintf(
				"%s/%s/%s/%s/*",
				notificationsTopic,
				websockets.WebsocketSubTopicRelationship,
				args,
				websockets.WebsocketSubTopicMomentChat,
			),
		}
		allowedPublishingChannels := []string{
			fmt.Sprintf("%s/%s/%s", notificationsTopic, websockets.WebsocketSubTopicRelationship, args),
			fmt.Sprintf(
				"%s/%s/%s/%s/*",
				notificationsTopic,
				websockets.WebsocketSubTopicRelationship,
				args,
				websockets.WebsocketSubTopicMomentChat,
			),
			fmt.Sprintf(
				"%s/%s/%s/%s",
				notificationsTopic,
				websockets.WebsocketSubTopicRelationship,
				args,
				websockets.WebsocketSubTopicHeartbeat,
			),
		}

		if after, ok := strings.CutPrefix(clientID, "client_user:"); ok {
			wsClientDetails := strings.Split(after, "_")
			userId := wsClientDetails[0]
			_ = wsClientDetails[1]

			userNotifications := fmt.Sprintf("%s/%s/notifications", notificationsTopic, userId)
			allowedSubscriptionChannels = append(allowedSubscriptionChannels, userNotifications)
			allowedPublishingChannels = append(allowedPublishingChannels, userNotifications)

			relationship, err := relationshipService.GetRelationshipById(ctx, args)

			if err == nil {
				var partnerId string
				if relationship.Partner1 == userId {
					partnerId = relationship.Partner2
				} else {
					partnerId = relationship.Partner1
				}
				partnerNotifications := fmt.Sprintf("%s/%s/notifications", notificationsTopic, partnerId)
				allowedPublishingChannels = append(allowedPublishingChannels, partnerNotifications)
			} else {
				logger.Println("Could not get relationship: ", err)
			}
		}

		paths.Subscribe = allowedSubscriptionChannels
		paths.Publish = allowedPublishingChannels
	case websockets.WebsocketTokenGlobal:
	default:
		paths.Subscribe = []string{}
		paths.Publish = []string{}
	}

	return paths, nil
}

type BuildPolicyArgs struct {
	AllowedPaths AllowedPaths
	Partition    string
	Region       string
	AccountId    string
	ClientId     string
}

func buildPolicy(args BuildPolicyArgs) *events.IAMPolicyDocument {
	policy := &events.IAMPolicyDocument{
		Version: "2012-10-17",
	}

	statements := []events.IAMPolicyStatement{
		{
			Action:   []string{"iot:Connect"},
			Effect:   "Allow",
			Resource: []string{"*"},
		},
	}

	if subscribers := args.AllowedPaths.Subscribe; len(subscribers) > 0 {
		statements = append(statements, events.IAMPolicyStatement{
			Action: []string{"iot:Receive"},
			Effect: "Allow",
			Resource: lo.Map(
				subscribers,
				func(t string, _ int) string {
					return fmt.Sprintf(
						"arn:%s:iot:%s:%s:topic/%s",
						args.Partition,
						args.Region,
						args.AccountId,
						t,
					)
				},
			),
		})

		statements = append(statements, events.IAMPolicyStatement{
			Action: []string{"iot:Subscribe"},
			Effect: "Allow",
			Resource: lo.Map(
				subscribers,
				func(t string, _ int) string {
					return fmt.Sprintf(
						"arn:%s:iot:%s:%s:topicfilter/%s",
						args.Partition,
						args.Region,
						args.AccountId,
						t,
					)
				},
			),
		})
	}

	if publishers := args.AllowedPaths.Publish; len(publishers) > 0 {
		statements = append(statements, events.IAMPolicyStatement{
			Action: []string{"iot:Publish"},
			Effect: "Allow",
			Resource: lo.Map(
				publishers,
				func(t string, _ int) string {
					return fmt.Sprintf(
						"arn:%s:iot:%s:%s:topic/%s",
						args.Partition,
						args.Region,
						args.AccountId,
						t,
					)
				},
			),
		})
	}

	policy.Statement = statements

	return policy
}

func denyResponse(principalId string) events.IoTCoreCustomAuthorizerResponse {
	if principalId == "" {
		principalId = "unauthorized"
	}
	return events.IoTCoreCustomAuthorizerResponse{
		IsAuthenticated:          false,
		PrincipalID:              principalId,
		DisconnectAfterInSeconds: 86400,
		RefreshAfterInSeconds:    300,
		PolicyDocuments:          []*events.IAMPolicyDocument{},
	}
}
