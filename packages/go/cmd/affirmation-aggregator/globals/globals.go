package globals

import (
	"lumi/pkg/dynamo"
	"lumi/pkg/sqs"
)

var DynamoTable *dynamo.DynamoTable
var SQSClient *sqs.SQSClient
