package models

import "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"

type InfiniteDataDto interface {
	GetLimit() int
	GetCursor() map[string]any
}

type InfiniteData[T any] struct {
	Data   []T
	Cursor map[string]types.AttributeValue
}
