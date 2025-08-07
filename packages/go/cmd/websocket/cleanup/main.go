package main

import (
	"context"
	"fmt"
	"log"
	"lumi/pkg/constructs"
	"lumi/pkg/dynamo"
	"lumi/pkg/models/user"
	"lumi/pkg/websockets"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/samber/lo"
)

const CONNECTION_TTL = time.Minute * 1

var dynamoTable *dynamo.DynamoTable
var ws *websockets.WebsocketService
var logger *log.Logger

func init() {
	services, err := constructs.CreateConstructs(constructs.CreateConstructsArgs{
		Dynamo: true,
	})

	if err != nil {
		panic(err)
	}

	dynamoTable = services.DynamoTable
	ws = websockets.NewSocketService(dynamoTable)
	logger = log.New(os.Stdout, "websocket-cleanup: ", log.LstdFlags)
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context) {
	logger.Println("Cleaning up expired websocket connections...")

	latestHealthyTime := time.Now().Add(-CONNECTION_TTL)

	expiredConnectionsResult, err := dynamo.GetItems(
		dynamoTable,
		dynamo.GetItemsParams[websockets.WebsocketHeartbeatRecord]{
			Ctx: ctx,
			QueryExpression: dynamo.DynamoQueryExpression{
				Expression: "#pk = :pk",
				Variables: map[string]any{
					":pk": websockets.WebsocketHeartbeatKeys{}.PK(),
				},
				Filter: &dynamo.DynamoQueryFilterExpression{
					Expression: "#timestamp < :timestamp",
					Variables: map[string]any{
						":timestamp": latestHealthyTime.Format(time.RFC3339),
					},
				},
			},
			Exhaustive: lo.ToPtr(true),
		},
	)

	if err != nil {
		logger.Println("Failed to get expired websocket connections:", err)
		return
	}

	expiredConnections := expiredConnectionsResult.Data
	logger.Printf("Found %d expired websocket connections\n", len(expiredConnections))

	if len(expiredConnections) > 0 {
		// Bulk delete heartbeats
		args := lo.Map(
			expiredConnections,
			func(connection websockets.WebsocketHeartbeatRecord, _ int) dynamo.BatchWriteItemsArgs {
				return dynamo.BatchWriteItemsArgs{
					Delete: &dynamo.WriteDeleteArgs{
						PK: connection.PK,
						SK: connection.SK,
					},
				}
			},
		)

		dynamo.BatchWriteItems(
			dynamoTable,
			ctx,
			args...,
		)

		// Update each user's status to offline
		uniqueUserIds := lo.Uniq(lo.Map(
			expiredConnections,
			func(connection websockets.WebsocketHeartbeatRecord, _ int) string {
				return connection.Payload.UserID
			},
		))

		updateArgs := lo.Map(
			uniqueUserIds,
			func(userId string, _ int) dynamo.UpdateManyItemArgs {
				return dynamo.UpdateManyItemArgs{
					PK: user.UserKeys{}.PK(userId),
					SK: user.UserKeys{}.SK(userId),
					UpdateBody: user.UpdateableUserRecord{
						Status: dynamo.NewUpdateValue(user.UserStatusOffline),
					},
				}
			},
		)

		_, errs := dynamo.UpdateMany[websockets.WebsocketHeartbeatRecord](
			dynamoTable,
			ctx,
			updateArgs,
		)

		if len(errs) > 0 {
			logger.Println("Failed to update user statuses:", errs)
			return
		}

		err := ws.OpenConnection()

		if err != nil {
			logger.Println("Failed to open connection:", err)
			return
		}

		defer ws.CloseConnection()

		logger.Println("Connected to websocket! Now sending out updates")
		topicPrefix := fmt.Sprintf("%s/%s/", os.Getenv("NOTIFICATIONS_TOPIC"), websockets.WebsocketSubTopicRelationship)

		subscribers := make(map[string]byte)

		for _, expiredConnection := range expiredConnections {
			subscribers[topicPrefix+expiredConnection.Payload.RelationshipID] = 1
		}

		token := ws.Client.SubscribeMultiple(
			subscribers,
			func(c mqtt.Client, m mqtt.Message) {},
		)

		if token.WaitTimeout(10*time.Second) && token.Error() != nil {
			logger.Printf("Failed to subscribe to websocket topics: %v\n", token.Error())
			return
		}

		for _, expiredConnection := range expiredConnections {
			userId,
				relationshipId,
				username := expiredConnection.Payload.UserID, expiredConnection.Payload.RelationshipID, expiredConnection.Payload.Username

			logger.Printf("Publishing offline message for relationship %s\n", relationshipId)
			err = ws.EmitEvent(websockets.EmitEventArgs{
				Topic:  topicPrefix + relationshipId,
				Source: websockets.WebsocketMessageSourceServer,
				Event:  websockets.WebsocketEventPresence,
				Payload: websockets.PresencePayload{
					UserID:   userId,
					Status:   user.UserStatusOffline,
					Username: username,
				},
			})

			if err != nil {
				logger.Printf("Failed to publish offline message for relationship %s: %v\n", relationshipId, err)
				continue
			}

			logger.Printf("Published offline message for relationship %s\n", relationshipId)
		}
	}
}
