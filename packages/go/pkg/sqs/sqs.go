package sqs

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"reflect"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
)

type SQSApi interface {
	SendMessage(ctx context.Context, params *sqs.SendMessageInput, optFns ...func(*sqs.Options)) (*sqs.SendMessageOutput, error)
	SendMessageBatch(ctx context.Context, params *sqs.SendMessageBatchInput, optFns ...func(*sqs.Options)) (*sqs.SendMessageBatchOutput, error)
	PurgeQueue(ctx context.Context, params *sqs.PurgeQueueInput, optFns ...func(*sqs.Options)) (*sqs.PurgeQueueOutput, error)
	DeleteMessage(ctx context.Context, params *sqs.DeleteMessageInput, optFns ...func(*sqs.Options)) (*sqs.DeleteMessageOutput, error)
	DeleteMessageBatch(ctx context.Context, params *sqs.DeleteMessageBatchInput, optFns ...func(*sqs.Options)) (*sqs.DeleteMessageBatchOutput, error)
}

type SQSClient struct {
	Client   SQSApi
	QueueUrl string
	Logger   *log.Logger
}

type NewQueueClientArgs struct {
	QueueUrl string
	Config   *aws.Config
}

func NewQueueClient(args NewQueueClientArgs) *SQSClient {
	url, cfg := args.QueueUrl, args.Config

	if cfg == nil {
		newCfg, err := config.LoadDefaultConfig(context.TODO())
		if err != nil {
			panic("configuration error, " + err.Error())
		}
		cfg = &newCfg
	}

	queueClient := sqs.NewFromConfig(*cfg)
	logger := log.New(os.Stdout, fmt.Sprintf("sqs-client(%s): ", url), log.LstdFlags)

	return &SQSClient{
		Client:   queueClient,
		QueueUrl: url,
		Logger:   logger,
	}
}

func (c *SQSClient) Purge(ctx context.Context) error {
	_, err := c.Client.PurgeQueue(ctx, &sqs.PurgeQueueInput{
		QueueUrl: aws.String(c.QueueUrl),
	})
	return err
}

func (c *SQSClient) DeleteMessage(ctx context.Context, receiptHandle string) error {
	_, err := c.Client.DeleteMessage(ctx, &sqs.DeleteMessageInput{
		QueueUrl:      aws.String(c.QueueUrl),
		ReceiptHandle: aws.String(receiptHandle),
	})
	return err
}

func (c *SQSClient) SendMessage(ctx context.Context, message any) error {
	var body string

	if str, ok := message.(string); ok {
		body = str
	} else if reflect.TypeOf(message).Kind() == reflect.Struct {
		encodedBytes, err := json.Marshal(message)
		if err != nil {
			return err
		}

		body = string(encodedBytes)
	} else {
		return errors.New("the message must be either a string or a json serializable struct")
	}

	if body == "" {
		return errors.New("the message body cannot be empty")
	}

	_, err := c.Client.SendMessage(ctx, &sqs.SendMessageInput{
		QueueUrl:    aws.String(c.QueueUrl),
		MessageBody: aws.String(body),
	})
	return err
}
