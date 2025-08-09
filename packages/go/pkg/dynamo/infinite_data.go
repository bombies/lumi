package dynamo

import (
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type DataOrderDto interface {
	GetOrder() DynamoQueryOrder
}

type InfiniteDataDto interface {
	GetLimit() int32
	GetCursor() map[string]any
}

type OrderedInfiniteDataDto interface {
	DataOrderDto
	InfiniteDataDto
}

type InfiniteData[T any] struct {
	Data       []T                             `json:"data"`
	NextCursor map[string]types.AttributeValue `json:"nextCursor"`
}

type InfiniteDataTupledCursor[T any] struct {
	Data       []T                                `json:"data"`
	NextCursor [2]map[string]types.AttributeValue `json:"nextCursor"`
}
