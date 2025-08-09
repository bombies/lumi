package globals

import (
	"lumi/pkg/dynamo"
	"lumi/pkg/s3"
)

var DynamoTable *dynamo.DynamoTable
var S3Bucket *s3.S3Bucket
