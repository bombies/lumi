package constructs

import (
	"context"
	"log"
	"lumi/pkg/dynamo"
	lumiRedis "lumi/pkg/redis"
	"lumi/pkg/s3"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/redis/go-redis/v9"
	"github.com/sst/sst/v3/sdk/golang/resource"
)

type AppConstructs struct {
	S3Bucket    *s3.S3Bucket
	DynamoTable *dynamo.DynamoTable
	RedisClient *redis.Client
}

type CreateConstructsArgs struct {
	S3     bool
	Dynamo bool
	Redis  bool
}

func CreateConstructs(args CreateConstructsArgs) (*AppConstructs, error) {
	var dynamoTable *dynamo.DynamoTable
	var s3Bucket *s3.S3Bucket
	var redisClient *redis.Client

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

	return &AppConstructs{
		S3Bucket:    s3Bucket,
		DynamoTable: dynamoTable,
		RedisClient: redisClient,
	}, nil
}
