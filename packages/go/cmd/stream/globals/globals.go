package globals

import (
	"lumi/pkg/dynamo"
	"lumi/pkg/s3"

	"github.com/redis/go-redis/v9"
)

var DynamoTable *dynamo.DynamoTable
var S3Bucket *s3.S3Bucket
var RedisClient *redis.Client
