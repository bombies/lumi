package constructs

import (
	"context"
	"errors"
	"log"
	"lumi/pkg/dynamo"
	lumiRedis "lumi/pkg/redis"
	"lumi/pkg/s3"
	"lumi/pkg/sqs"
	"os"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/redis/go-redis/v9"
	"github.com/sst/sst/v3/sdk/golang/resource"
)

type AppConstructs struct {
	S3Bucket    *s3.S3Bucket
	DynamoTable *dynamo.DynamoTable
	RedisClient *redis.Client
	SQSClient   *sqs.SQSClient
}

type CreateConstructsArgs struct {
	S3     bool
	Dynamo bool
	Redis  bool
	SQS    bool
}

func CreateConstructs(args CreateConstructsArgs) (*AppConstructs, error) {
	var dynamoTable *dynamo.DynamoTable
	var s3Bucket *s3.S3Bucket
	var redisClient *redis.Client
	var sqsClient *sqs.SQSClient

	cfg, err := config.LoadDefaultConfig(context.TODO())

	if err != nil {
		return nil, err
	}

	if args.Dynamo {
		tableName, err := resource.Get("Database", "name")

		if err != nil {
			return nil, err
		}

		dynamoTable = &dynamo.DynamoTable{
			TableName:    tableName.(string),
			DynamoClient: dynamodb.NewFromConfig(cfg),
		}
		log.Printf("Initialized Dynamo client for %s!\n", dynamoTable.TableName)
	}

	if args.S3 {
		bucketName, err := resource.Get("ContentBucket", "name")

		if err != nil {
			return nil, err
		}

		s3Bucket = s3.NewBucket(s3.NewBucketArgs{
			BucketName: bucketName.(string),
			Config:     &cfg,
		})
		log.Printf("Initialized S3 client for %s!\n", s3Bucket.BucketName)
	}

	if args.Redis {
		redisClient = lumiRedis.NewRedisClient()
		log.Printf("Initialized Redis client!\n")
	}

	if args.SQS {
		queueUrl := os.Getenv("QUEUE_URL")

		if queueUrl == "" {
			return nil, errors.New("QUEUE_URL environment variable not set")
		}

		sqsClient = sqs.NewQueueClient(sqs.NewQueueClientArgs{
			Config:   &cfg,
			QueueUrl: queueUrl,
		})
		log.Printf("Initialized SQS client!\n")
	}

	return &AppConstructs{
		S3Bucket:    s3Bucket,
		DynamoTable: dynamoTable,
		RedisClient: redisClient,
		SQSClient:   sqsClient,
	}, nil
}
