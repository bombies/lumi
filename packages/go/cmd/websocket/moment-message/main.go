package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"lumi/pkg/constructs"
	"lumi/pkg/dynamo"
	"lumi/pkg/models/moment"
	"lumi/pkg/websockets"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
)

var dynamoTable *dynamo.DynamoTable
var momentService *moment.MomentService
var logger *log.Logger

func init() {
	services, err := constructs.CreateConstructs(constructs.CreateConstructsArgs{
		Dynamo: true,
	})

	if err != nil {
		panic(err)
	}

	dynamoTable = services.DynamoTable
	momentService = moment.NewMomentService(moment.MomentServiceArgs{
		DynamoTable: dynamoTable,
	})
	logger = log.New(os.Stdout, "websocket-moment-message: ", log.LstdFlags)
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event any) error {
	eventBytes, err := json.Marshal(event)
	if err != nil {
		logger.Printf("failed to marshal event: %v", err)
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	var baseMessage websockets.TypedWebsocketMessage[json.RawMessage]
	if err := json.Unmarshal(eventBytes, &baseMessage); err != nil {
		logger.Printf("failed to unmarshal base message: %v", err)
		return fmt.Errorf("failed to unmarshal base message: %w", err)
	}

	logger.Printf("Received event of type: %s", baseMessage.Type)

	switch baseMessage.Type {
	case websockets.WebsocketEventMomentChat:
		var msg websockets.TypedWebsocketMessage[websockets.MomentChatPayload]
		if err := json.Unmarshal(eventBytes, &msg); err != nil {
			logger.Printf("failed to unmarshal message: %v", err)
			return fmt.Errorf("failed to unmarshal message: %w", err)
		}

		payload := msg.Payload
		if _, err = momentService.CreateMomentMessage(ctx, payload.SenderID, payload.MomentID, moment.CreateMomentMessageDto{
			Id:        &payload.MessageID,
			Content:   payload.Message,
			Timestamp: &payload.Timestamp,
		}); err != nil {
			logger.Printf("failed to create moment message: %v", err)
			return fmt.Errorf("failed to create moment message: %w", err)
		}

	case websockets.WebsocketEventMomentStateUpdate:
		var msg websockets.TypedWebsocketMessage[websockets.MomentMessageStateUpdatePayload]
		if err := json.Unmarshal(eventBytes, &msg); err != nil {
			logger.Printf("failed to unmarshal message: %v", err)
			return fmt.Errorf("failed to unmarshal message: %w", err)
		}

		payload := msg.Payload
		if _, err := momentService.UpdateMomentMessage(
			ctx, payload.MessageID, moment.UpdateMomentMessageDto{
				Content: &payload.Content,
				State:   &payload.State,
			},
		); err != nil {
			logger.Printf("failed to update moment message: %v", err)
			return fmt.Errorf("failed to update moment message: %w", err)
		}

	case websockets.WebsocketEventMomentMessageReact:
		var msg websockets.TypedWebsocketMessage[websockets.MomentMessageReactPayload]
		if err := json.Unmarshal(eventBytes, &msg); err != nil {
			logger.Printf("failed to unmarshal message: %v", err)
			return fmt.Errorf("failed to unmarshal message: %w", err)
		}

		payload := msg.Payload
		if _, err := momentService.UpdateMomentMessage(
			ctx, payload.MessageID, moment.UpdateMomentMessageDto{
				Reaction: &payload.Reaction,
			},
		); err != nil {
			logger.Printf("failed to update moment message reaction: %v", err)
			return fmt.Errorf("failed to update moment message reaction: %w", err)
		}
	}

	logger.Println("Successfully handled moment message event!")
	return nil
}
