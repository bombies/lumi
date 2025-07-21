package dynamo

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type DynamoTableIndex string

const (
	GSI1 DynamoTableIndex = "GSI1"
	GSI2 DynamoTableIndex = "GSI2"
	GSI3 DynamoTableIndex = "GSI3"
	GSI4 DynamoTableIndex = "GSI4"
)

type DynamoAPI interface {
	Query(ctx context.Context, params *dynamodb.QueryInput, optFns ...func(*dynamodb.Options)) (*dynamodb.QueryOutput, error)
	GetItem(ctx context.Context, params *dynamodb.GetItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.GetItemOutput, error)
	PutItem(ctx context.Context, params *dynamodb.PutItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.PutItemOutput, error)
	UpdateItem(ctx context.Context, params *dynamodb.UpdateItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.UpdateItemOutput, error)
	DeleteItem(ctx context.Context, params *dynamodb.DeleteItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.DeleteItemOutput, error)
	BatchGetItem(ctx context.Context, params *dynamodb.BatchGetItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.BatchGetItemOutput, error)
	BatchWriteItem(ctx context.Context, params *dynamodb.BatchWriteItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.BatchWriteItemOutput, error)
	TransactGetItems(ctx context.Context, params *dynamodb.TransactGetItemsInput, optFns ...func(*dynamodb.Options)) (*dynamodb.TransactGetItemsOutput, error)
	TransactWriteItems(ctx context.Context, params *dynamodb.TransactWriteItemsInput, optFns ...func(*dynamodb.Options)) (*dynamodb.TransactWriteItemsOutput, error)
}

type DynamoTable struct {
	DynamoClient DynamoAPI
	TableName    string
}

type DynamoPrimaryKey struct {
	PK string `json:"pk"`
	SK string `json:"sk"`
}

type DynamoGSI1Keys struct {
	GSI1PK string `json:"gsi1pk"`
	GSI1SK string `json:"gsi1sk"`
}

type DynamoGSI2Keys struct {
	GSI2PK string `json:"gsi2pk"`
	GSI2SK string `json:"gsi2sk"`
}

type DynamoGSI3Keys struct {
	GSI3PK string `json:"gsi3pk"`
	GSI3SK string `json:"gsi3sk"`
}

type DynamoGSI4Keys struct {
	GSI4PK string `json:"gsi4pk"`
	GSI4SK string `json:"gsi4sk"`
}

type UpdateablePrimaryKey struct {
	PK UpdateableDynamoField[string] `json:"pk"`
	SK UpdateableDynamoField[string] `json:"sk"`
}

type UpdateableGlobalIndex1Keys struct {
	GSI1PK UpdateableDynamoField[string] `json:"gsi1pk"`
	GSI1SK UpdateableDynamoField[string] `json:"gsi1sk"`
}

type UpdateableGlobalIndex2Keys struct {
	GSI2PK UpdateableDynamoField[string] `json:"gsi2pk"`
	GSI2SK UpdateableDynamoField[string] `json:"gsi2sk"`
}

type UpdateableGlobalIndex3Keys struct {
	GSI3PK UpdateableDynamoField[string] `json:"gsi3pk"`
	GSI3SK UpdateableDynamoField[string] `json:"gsi3sk"`
}

type UpdateableGlobalIndex4Keys struct {
	GSI4PK UpdateableDynamoField[string] `json:"gsi4pk"`
	GSI4SK UpdateableDynamoField[string] `json:"gsi4sk"`
}

type UpdateableDynamoField[T any] struct {
	Value  *T    `json:"value,omitempty"`
	Remove *bool `json:"remove,omitempty"`
}

func NewUpdateValue[T any](v T) UpdateableDynamoField[T] {
	return UpdateableDynamoField[T]{Value: &v}
}

func NewRemoveValue[T any]() UpdateableDynamoField[T] {
	isRemove := true
	return UpdateableDynamoField[T]{Remove: &isRemove}
}

type DynamoItem struct {
	DynamoPrimaryKey
	GSI1PK *string `json:"gsi1pk"`
	GSI1SK *string `json:"gsi1sk"`
	GSI2PK *string `json:"gsi2pk"`
	GSI2SK *string `json:"gsi2sk"`
	GSI3PK *string `json:"gsi3pk"`
	GSI3SK *string `json:"gsi3sk"`
	GSI4PK *string `json:"gsi4pk"`
	GSI4SK *string `json:"gsi4sk"`
}

type DynamoRecord interface {
	GetPK() string
	GetSK() string
}

type DynamoGSIRecord interface {
	DynamoRecord
	GetGSI1() (pk *string, sk *string)
	GetGSI2() (pk *string, sk *string)
	GetGSI3() (pk *string, sk *string)
	GetGSI4() (pk *string, sk *string)
}

type DynamoGSI1Record interface {
	DynamoRecord
	GetGSI1() (pk *string, sk *string)
}

type PutItemArgs[T DynamoRecord] struct {
	Ctx  context.Context
	Item T
}

type GetItemArgs struct {
	Ctx                 context.Context
	PK                  string
	SK                  string
	ProjectedAttributes []string
}

type BatchGetItemArgs struct {
	Ctx  context.Context
	Keys []DynamoPrimaryKey
}

type DynamoQueryOrder string

const (
	AscendingQueryOrder  DynamoQueryOrder = "asc"
	DescendingQueryOrder DynamoQueryOrder = "desc"
)

type DynamoQueryFilterExpression struct {
	Expression string
	Variables  map[string]any
}

type DynamoQueryExpression struct {
	Expression string
	Variables  map[string]any
	Filter     *DynamoQueryFilterExpression
}

type GetItemsParams[T DynamoRecord] struct {
	Ctx                 context.Context
	Index               *DynamoTableIndex
	Order               *DynamoQueryOrder
	Cursor              map[string]types.AttributeValue
	Limit               *int32
	ProjectedAttributes []string
	QueryExpression     DynamoQueryExpression
	Exhaustive          *bool
	Mapper              func(T) T
}

type GetItemsResult[T any] struct {
	Data       []T
	NextCursor map[string]types.AttributeValue
}

type ProjectionFields struct {
	ProjectionExpression      string
	ProjectionExpressionNames map[string]string
}

type QueryWithPaginationExhaustionArgs[T any] struct {
	Table  *DynamoTable
	Ctx    context.Context
	Params *dynamodb.QueryInput
	Mapper func(T) T
}

type GetDynamicUpdateStatementsResult struct {
	UpdateStatements          string
	ExpressionAttributeNames  map[string]string
	ExpressionAttributeValues map[string]types.AttributeValue
}

type UpdateItemArgs struct {
	Ctx        context.Context
	PK         string
	SK         string
	UpdateBody any
}

type DeleteItemArgs struct {
	Ctx context.Context
	PK  string
	SK  string
}
