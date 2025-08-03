package globals

import (
	"lumi/pkg/dynamo"
	"lumi/pkg/s3"

	"github.com/redis/go-redis/v9"
)

var S3Bucket *s3.S3Bucket
var DynamoTable *dynamo.DynamoTable
var RedisClient *redis.Client
