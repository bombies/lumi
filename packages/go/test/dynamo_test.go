package test

import (
	"context"
	"errors"
	"lumi/pkg/dynamo"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/samber/lo"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockDynamoClient struct {
	mock.Mock
}

func (m *MockDynamoClient) Query(ctx context.Context, params *dynamodb.QueryInput, optFns ...func(*dynamodb.Options)) (*dynamodb.QueryOutput, error) {
	args := m.Called(ctx, params)
	return args.Get(0).(*dynamodb.QueryOutput), args.Error(1)
}

func (m *MockDynamoClient) GetItem(ctx context.Context, params *dynamodb.GetItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.GetItemOutput, error) {
	args := m.Called(ctx, params)
	return args.Get(0).(*dynamodb.GetItemOutput), args.Error(1)
}

func (m *MockDynamoClient) PutItem(ctx context.Context, params *dynamodb.PutItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.PutItemOutput, error) {
	args := m.Called(ctx, params)
	return args.Get(0).(*dynamodb.PutItemOutput), args.Error(1)
}

func (m *MockDynamoClient) UpdateItem(ctx context.Context, params *dynamodb.UpdateItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.UpdateItemOutput, error) {
	args := m.Called(ctx, params)
	return args.Get(0).(*dynamodb.UpdateItemOutput), args.Error(1)
}

func (m *MockDynamoClient) DeleteItem(ctx context.Context, params *dynamodb.DeleteItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.DeleteItemOutput, error) {
	args := m.Called(ctx, params)
	return args.Get(0).(*dynamodb.DeleteItemOutput), args.Error(1)
}

func (m *MockDynamoClient) BatchGetItem(ctx context.Context, params *dynamodb.BatchGetItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.BatchGetItemOutput, error) {
	args := m.Called(ctx, params)
	return args.Get(0).(*dynamodb.BatchGetItemOutput), args.Error(1)
}

func (m *MockDynamoClient) BatchWriteItem(ctx context.Context, params *dynamodb.BatchWriteItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.BatchWriteItemOutput, error) {
	args := m.Called(ctx, params)
	return args.Get(0).(*dynamodb.BatchWriteItemOutput), args.Error(1)
}

func (m *MockDynamoClient) TransactGetItems(ctx context.Context, params *dynamodb.TransactGetItemsInput, optFns ...func(*dynamodb.Options)) (*dynamodb.TransactGetItemsOutput, error) {
	args := m.Called(ctx, params)
	return args.Get(0).(*dynamodb.TransactGetItemsOutput), args.Error(1)
}

func (m *MockDynamoClient) TransactWriteItems(ctx context.Context, params *dynamodb.TransactWriteItemsInput, optFns ...func(*dynamodb.Options)) (*dynamodb.TransactWriteItemsOutput, error) {
	args := m.Called(ctx, params)
	return args.Get(0).(*dynamodb.TransactWriteItemsOutput), args.Error(1)
}

// Test struct for testing
type TestItem struct {
	dynamo.DynamoItem
	ID   string  `json:"id"`
	Name string  `json:"name"`
	Age  float64 `json:"age"`
}

func (t TestItem) GetPK() string {
	return t.PK
}

func (t TestItem) GetSK() string {
	return t.SK
}

func TestGetItems_NonExhaustive_Success(t *testing.T) {
	mockClient := &MockDynamoClient{}
	table := &dynamo.DynamoTable{
		DynamoClient: mockClient,
		TableName:    "test-table",
	}

	mockOutput := &dynamodb.QueryOutput{
		Items: []map[string]types.AttributeValue{
			{
				"id":   &types.AttributeValueMemberS{Value: "1"},
				"name": &types.AttributeValueMemberS{Value: "John"},
				"age":  &types.AttributeValueMemberN{Value: "25"},
			},
		},
		LastEvaluatedKey: map[string]types.AttributeValue{
			"id": &types.AttributeValueMemberS{Value: "1"},
		},
	}

	mockClient.On("Query", mock.Anything, mock.Anything).Return(mockOutput, nil)

	params := dynamo.GetItemsParams[TestItem]{
		Ctx:        context.Background(),
		Index:      lo.ToPtr(dynamo.GSI1),
		Order:      lo.ToPtr(dynamo.AscendingQueryOrder),
		Limit:      lo.ToPtr[int32](10),
		Exhaustive: lo.ToPtr(false),
		QueryExpression: dynamo.DynamoQueryExpression{
			Expression: "#pk = :pk",
			Variables: map[string]any{
				":pk": "test",
			},
		},
	}

	result, err := dynamo.GetItems(table, params)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Len(t, result.Data, 1)
	assert.Equal(t, "1", result.Data[0].ID)
	assert.Equal(t, "John", result.Data[0].Name)
	assert.Equal(t, float64(25), result.Data[0].Age)
	assert.NotNil(t, result.NextCursor)
	mockClient.AssertExpectations(t)
}

func TestGetItems_Exhaustive_Success(t *testing.T) {
	mockClient := &MockDynamoClient{}
	table := &dynamo.DynamoTable{
		DynamoClient: mockClient,
		TableName:    "test-table",
	}

	// First call returns items with LastEvaluatedKey
	firstOutput := &dynamodb.QueryOutput{
		Items: []map[string]types.AttributeValue{
			{
				"id":   &types.AttributeValueMemberS{Value: "1"},
				"name": &types.AttributeValueMemberS{Value: "John"},
				"age":  &types.AttributeValueMemberN{Value: "25"},
			},
		},
		LastEvaluatedKey: map[string]types.AttributeValue{
			"id": &types.AttributeValueMemberS{Value: "1"},
		},
	}

	// Second call returns items without LastEvaluatedKey (end of pagination)
	secondOutput := &dynamodb.QueryOutput{
		Items: []map[string]types.AttributeValue{
			{
				"id":   &types.AttributeValueMemberS{Value: "2"},
				"name": &types.AttributeValueMemberS{Value: "Jane"},
				"age":  &types.AttributeValueMemberN{Value: "30"},
			},
		},
		LastEvaluatedKey: nil,
	}

	mockClient.On("Query", mock.Anything, mock.Anything).Return(firstOutput, nil).Once()
	mockClient.On("Query", mock.Anything, mock.Anything).Return(secondOutput, nil).Once()

	params := dynamo.GetItemsParams[TestItem]{
		Ctx:        context.Background(),
		Exhaustive: lo.ToPtr(true),
		QueryExpression: dynamo.DynamoQueryExpression{
			Expression: "#pk = :pk",
			Variables: map[string]any{
				":pk": "test",
			},
		},
	}

	result, err := dynamo.GetItems(table, params)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Len(t, result.Data, 2)
	assert.Nil(t, result.NextCursor)
	mockClient.AssertExpectations(t)
}

func TestGetItems_WithFilter_Success(t *testing.T) {
	mockClient := &MockDynamoClient{}
	table := &dynamo.DynamoTable{
		DynamoClient: mockClient,
		TableName:    "test-table",
	}

	mockOutput := &dynamodb.QueryOutput{
		Items: []map[string]types.AttributeValue{
			{
				"id":   &types.AttributeValueMemberS{Value: "1"},
				"name": &types.AttributeValueMemberS{Value: "John"},
				"age":  &types.AttributeValueMemberN{Value: "25"},
			},
		},
	}

	mockClient.On("Query", mock.Anything, mock.Anything).Return(mockOutput, nil)

	params := dynamo.GetItemsParams[TestItem]{
		Ctx:        context.Background(),
		Exhaustive: lo.ToPtr(false),
		QueryExpression: dynamo.DynamoQueryExpression{
			Expression: "#pk = :pk",
			Variables: map[string]any{
				":pk": "test",
			},
			Filter: &dynamo.DynamoQueryFilterExpression{
				Expression: "#age > :minAge",
				Variables: map[string]any{
					":minAge": 18,
				},
			},
		},
	}

	result, err := dynamo.GetItems(table, params)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	mockClient.AssertExpectations(t)
}

func TestGetItems_WithMapper_Success(t *testing.T) {
	mockClient := &MockDynamoClient{}
	table := &dynamo.DynamoTable{
		DynamoClient: mockClient,
		TableName:    "test-table",
	}

	mockOutput := &dynamodb.QueryOutput{
		Items: []map[string]types.AttributeValue{
			{
				"id":   &types.AttributeValueMemberS{Value: "1"},
				"name": &types.AttributeValueMemberS{Value: "john"},
				"age":  &types.AttributeValueMemberN{Value: "25"},
			},
		},
	}

	mockClient.On("Query", mock.Anything, mock.Anything).Return(mockOutput, nil)

	mapper := func(item TestItem) TestItem {
		item.Name = strings.ToUpper(item.Name)
		return item
	}

	params := dynamo.GetItemsParams[TestItem]{
		Ctx:        context.Background(),
		Exhaustive: lo.ToPtr(false),
		Mapper:     mapper,
		QueryExpression: dynamo.DynamoQueryExpression{
			Expression: "#pk = :pk",
			Variables: map[string]any{
				":pk": "test",
			},
		},
	}

	result, err := dynamo.GetItems(table, params)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Len(t, result.Data, 1)
	assert.Equal(t, "JOHN", result.Data[0].Name)
	mockClient.AssertExpectations(t)
}

func TestGetItems_QueryError(t *testing.T) {
	mockClient := &MockDynamoClient{}
	table := &dynamo.DynamoTable{
		DynamoClient: mockClient,
		TableName:    "test-table",
	}

	mockClient.On("Query", mock.Anything, mock.Anything).Return((*dynamodb.QueryOutput)(nil), errors.New("query error"))

	params := dynamo.GetItemsParams[TestItem]{
		Ctx:        context.Background(),
		Exhaustive: lo.ToPtr(false),
		QueryExpression: dynamo.DynamoQueryExpression{
			Expression: "#pk = :pk",
			Variables: map[string]any{
				":pk": "test",
			},
		},
	}

	result, err := dynamo.GetItems(table, params)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "query error")
	mockClient.AssertExpectations(t)
}

func TestGetProjectionFields_EmptyFields(t *testing.T) {
	fields := []string{}
	result := dynamo.GetProjectionFields(fields)

	assert.Empty(t, result.ProjectionExpression)
	assert.Empty(t, result.ProjectionExpressionNames)
}

func TestGetProjectionFields_WithFields(t *testing.T) {
	fields := []string{"id", "name", "age"}
	result := dynamo.GetProjectionFields(fields)

	assert.Equal(t, "#id, #name, #age", result.ProjectionExpression)
	assert.Equal(t, map[string]string{
		"#id":   "id",
		"#name": "name",
		"#age":  "age",
	}, result.ProjectionExpressionNames)
}

func TestGetProjectionExpression_EmptyFields(t *testing.T) {
	fields := []string{}
	result := dynamo.GetProjectionExpression(fields)

	assert.Empty(t, result)
}

func TestGetProjectionExpression_WithFields(t *testing.T) {
	fields := []string{"id", "name"}
	result := dynamo.GetProjectionExpression(fields)

	assert.Equal(t, "#id, #name", result)
}

func TestGetProjectionExpressionNames_EmptyFields(t *testing.T) {
	fields := []string{}
	result := dynamo.GetProjectionExpressionNames(fields)

	assert.Empty(t, result)
}

func TestGetProjectionExpressionNames_WithFields(t *testing.T) {
	fields := []string{"id", "name"}
	result := dynamo.GetProjectionExpressionNames(fields)

	expected := map[string]string{
		"#id":   "id",
		"#name": "name",
	}
	assert.Equal(t, expected, result)
}

func TestQueryWithPaginationExhaustion_Success(t *testing.T) {
	mockClient := &MockDynamoClient{}
	table := &dynamo.DynamoTable{
		DynamoClient: mockClient,
		TableName:    "test-table",
	}

	// First call returns items with LastEvaluatedKey
	firstOutput := &dynamodb.QueryOutput{
		Items: []map[string]types.AttributeValue{
			{
				"id":   &types.AttributeValueMemberS{Value: "1"},
				"name": &types.AttributeValueMemberS{Value: "John"},
			},
		},
		LastEvaluatedKey: map[string]types.AttributeValue{
			"id": &types.AttributeValueMemberS{Value: "1"},
		},
	}

	// Second call returns items without LastEvaluatedKey
	secondOutput := &dynamodb.QueryOutput{
		Items: []map[string]types.AttributeValue{
			{
				"id":   &types.AttributeValueMemberS{Value: "2"},
				"name": &types.AttributeValueMemberS{Value: "Jane"},
			},
		},
		LastEvaluatedKey: nil,
	}

	mockClient.On("Query", mock.Anything, mock.Anything).Return(firstOutput, nil).Once()
	mockClient.On("Query", mock.Anything, mock.Anything).Return(secondOutput, nil).Once()

	params := &dynamodb.QueryInput{
		TableName: lo.ToPtr("test-table"),
	}

	args := dynamo.QueryWithPaginationExhaustionArgs[TestItem]{
		Table:  table,
		Ctx:    context.Background(),
		Params: params,
	}

	result, err := dynamo.QueryWithPaginationExhaustion(args)

	assert.NoError(t, err)
	assert.Len(t, result, 2)
	mockClient.AssertExpectations(t)
}

func TestQueryWithPaginationExhaustion_Error(t *testing.T) {
	mockClient := &MockDynamoClient{}
	table := &dynamo.DynamoTable{
		DynamoClient: mockClient,
		TableName:    "test-table",
	}

	mockClient.On("Query", mock.Anything, mock.Anything).Return((*dynamodb.QueryOutput)(nil), errors.New("query error"))

	params := &dynamodb.QueryInput{
		TableName: lo.ToPtr("test-table"),
	}

	args := dynamo.QueryWithPaginationExhaustionArgs[TestItem]{
		Table:  table,
		Ctx:    context.Background(),
		Params: params,
	}

	result, err := dynamo.QueryWithPaginationExhaustion(args)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "query error")
	mockClient.AssertExpectations(t)
}

func TestPutItem_Success(t *testing.T) {
	mockClient := &MockDynamoClient{}
	table := &dynamo.DynamoTable{
		DynamoClient: mockClient,
		TableName:    "test-table",
	}

	mockOutput := &dynamodb.PutItemOutput{
		Attributes: map[string]types.AttributeValue{
			"id":   &types.AttributeValueMemberS{Value: "1"},
			"name": &types.AttributeValueMemberS{Value: "John"},
			"age":  &types.AttributeValueMemberN{Value: "25"},
		},
	}

	mockClient.On("PutItem", mock.Anything, mock.Anything).Return(mockOutput, nil)

	item := TestItem{
		ID:   "1",
		Name: "John",
		Age:  25,
	}

	args := dynamo.PutItemArgs[TestItem]{
		Ctx:  context.Background(),
		Item: item,
	}

	result, err := dynamo.PutItem(table, args)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "1", result.ID)
	assert.Equal(t, "John", result.Name)
	assert.Equal(t, float64(25), result.Age)
	mockClient.AssertExpectations(t)
}

func TestPutItem_Error(t *testing.T) {
	mockClient := &MockDynamoClient{}
	table := &dynamo.DynamoTable{
		DynamoClient: mockClient,
		TableName:    "test-table",
	}

	mockClient.On("PutItem", mock.Anything, mock.Anything).Return((*dynamodb.PutItemOutput)(nil), errors.New("put error"))

	item := TestItem{
		ID:   "1",
		Name: "John",
		Age:  25,
	}

	args := dynamo.PutItemArgs[TestItem]{
		Ctx:  context.Background(),
		Item: item,
	}

	result, err := dynamo.PutItem(table, args)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "put error")
	mockClient.AssertExpectations(t)
}

func TestGetItem_Success(t *testing.T) {
	mockClient := &MockDynamoClient{}
	table := &dynamo.DynamoTable{
		DynamoClient: mockClient,
		TableName:    "test-table",
	}

	mockOutput := &dynamodb.GetItemOutput{
		Item: map[string]types.AttributeValue{
			"id":   &types.AttributeValueMemberS{Value: "1"},
			"name": &types.AttributeValueMemberS{Value: "John"},
			"age":  &types.AttributeValueMemberN{Value: "25"},
		},
	}

	mockClient.On("GetItem", mock.Anything, mock.MatchedBy(func(params *dynamodb.GetItemInput) bool {
		return params.Key["pk"].(*types.AttributeValueMemberS).Value == "test-pk" &&
			params.Key["sk"].(*types.AttributeValueMemberS).Value == "test-sk"
	})).Return(mockOutput, nil)

	args := dynamo.GetItemArgs{
		Ctx: context.Background(),
		PK:  "test-pk",
		SK:  "test-sk",
	}

	result, err := dynamo.GetItem[TestItem](table, args)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "1", result.ID)
	assert.Equal(t, "John", result.Name)
	assert.Equal(t, float64(25), result.Age)
	mockClient.AssertExpectations(t)
}

func TestGetItem_WithProjection_Success(t *testing.T) {
	mockClient := &MockDynamoClient{}
	table := &dynamo.DynamoTable{
		DynamoClient: mockClient,
		TableName:    "test-table",
	}

	mockOutput := &dynamodb.GetItemOutput{
		Item: map[string]types.AttributeValue{
			"id":   &types.AttributeValueMemberS{Value: "1"},
			"name": &types.AttributeValueMemberS{Value: "John"},
		},
	}

	mockClient.On("GetItem", mock.Anything, mock.MatchedBy(func(params *dynamodb.GetItemInput) bool {
		return params.ProjectionExpression != nil && *params.ProjectionExpression == "id,name"
	})).Return(mockOutput, nil)

	args := dynamo.GetItemArgs{
		Ctx:                 context.Background(),
		PK:                  "test-pk",
		SK:                  "test-sk",
		ProjectedAttributes: []string{"id", "name"},
	}

	result, err := dynamo.GetItem[TestItem](table, args)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	mockClient.AssertExpectations(t)
}

func TestGetItem_Error(t *testing.T) {
	mockClient := &MockDynamoClient{}
	table := &dynamo.DynamoTable{
		DynamoClient: mockClient,
		TableName:    "test-table",
	}

	mockClient.On("GetItem", mock.Anything, mock.Anything).Return((*dynamodb.GetItemOutput)(nil), errors.New("get error"))

	args := dynamo.GetItemArgs{
		Ctx: context.Background(),
		PK:  "test-pk",
		SK:  "test-sk",
	}

	result, err := dynamo.GetItem[TestItem](table, args)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "get error")
	mockClient.AssertExpectations(t)
}

func TestBatchGetItems_Success(t *testing.T) {
	mockClient := &MockDynamoClient{}
	table := &dynamo.DynamoTable{
		DynamoClient: mockClient,
		TableName:    "test-table",
	}

	mockOutput := &dynamodb.BatchGetItemOutput{
		Responses: map[string][]map[string]types.AttributeValue{
			"test-table": {
				{
					"id":   &types.AttributeValueMemberS{Value: "1"},
					"name": &types.AttributeValueMemberS{Value: "John"},
					"age":  &types.AttributeValueMemberN{Value: "25"},
				},
				{
					"id":   &types.AttributeValueMemberS{Value: "2"},
					"name": &types.AttributeValueMemberS{Value: "Jane"},
					"age":  &types.AttributeValueMemberN{Value: "30"},
				},
			},
		},
	}

	mockClient.On("BatchGetItem", mock.Anything, mock.Anything).Return(mockOutput, nil)

	keys := []dynamo.DynamoPrimaryKey{
		{PK: "pk1", SK: "sk1"},
		{PK: "pk2", SK: "sk2"},
	}

	args := dynamo.BatchGetItemArgs{
		Ctx:  context.Background(),
		Keys: keys,
	}

	result := dynamo.BatchGetItems[TestItem](table, args)

	assert.Len(t, result, 2)
	assert.Equal(t, "1", result[0].ID)
	assert.Equal(t, "John", result[0].Name)
	assert.Equal(t, "2", result[1].ID)
	assert.Equal(t, "Jane", result[1].Name)
	mockClient.AssertExpectations(t)
}

func TestBatchGetItems_Error(t *testing.T) {
	mockClient := &MockDynamoClient{}
	table := &dynamo.DynamoTable{
		DynamoClient: mockClient,
		TableName:    "test-table",
	}

	mockClient.On("BatchGetItem", mock.Anything, mock.Anything).Return((*dynamodb.BatchGetItemOutput)(nil), errors.New("batch get error"))

	keys := []dynamo.DynamoPrimaryKey{
		{PK: "pk1", SK: "sk1"},
	}

	args := dynamo.BatchGetItemArgs{
		Ctx:  context.Background(),
		Keys: keys,
	}

	result := dynamo.BatchGetItems[TestItem](table, args)

	assert.Empty(t, result)
	mockClient.AssertExpectations(t)
}

func TestUpdateItem_Success(t *testing.T) {
	mockClient := &MockDynamoClient{}
	table := &dynamo.DynamoTable{
		DynamoClient: mockClient,
		TableName:    "test-table",
	}

	mockOutput := &dynamodb.UpdateItemOutput{
		Attributes: map[string]types.AttributeValue{
			"id":   &types.AttributeValueMemberS{Value: "1"},
			"name": &types.AttributeValueMemberS{Value: "John Updated"},
			"age":  &types.AttributeValueMemberN{Value: "26"},
		},
	}

	mockClient.On("UpdateItem", mock.Anything, mock.MatchedBy(func(params *dynamodb.UpdateItemInput) bool {
		return params.Key["pk"].(*types.AttributeValueMemberS).Value == "test-pk" &&
			params.Key["sk"].(*types.AttributeValueMemberS).Value == "test-sk"
	})).Return(mockOutput, nil)

	args := dynamo.UpdateItemArgs{
		Ctx: context.Background(),
		PK:  "test-pk",
		SK:  "test-sk",
		UpdateBody: struct {
			Name string `json:"name"`
			Age  string `json:"age"`
		}{
			Name: "John Updated",
			Age:  "26",
		},
	}

	result, err := dynamo.UpdateItem[TestItem](table, args)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "1", result.ID)
	assert.Equal(t, "John Updated", result.Name)
	assert.Equal(t, float64(26), result.Age)
	mockClient.AssertExpectations(t)
}

func TestUpdateItem_Error(t *testing.T) {
	mockClient := &MockDynamoClient{}
	table := &dynamo.DynamoTable{
		DynamoClient: mockClient,
		TableName:    "test-table",
	}

	mockClient.On("UpdateItem", mock.Anything, mock.Anything).Return((*dynamodb.UpdateItemOutput)(nil), errors.New("update error"))

	args := dynamo.UpdateItemArgs{
		Ctx: context.Background(),
		PK:  "test-pk",
		SK:  "test-sk",
		UpdateBody: struct {
			Name string `json:"name"`
		}{
			Name: " Updated",
		},
	}

	result, err := dynamo.UpdateItem[TestItem](table, args)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "update error")
	mockClient.AssertExpectations(t)
}

func TestDeleteItem_Success(t *testing.T) {
	mockClient := &MockDynamoClient{}
	table := &dynamo.DynamoTable{
		DynamoClient: mockClient,
		TableName:    "test-table",
	}

	mockOutput := &dynamodb.DeleteItemOutput{}

	mockClient.On("DeleteItem", mock.Anything, mock.MatchedBy(func(params *dynamodb.DeleteItemInput) bool {
		return params.Key["pk"].(*types.AttributeValueMemberS).Value == "test-pk" &&
			params.Key["sk"].(*types.AttributeValueMemberS).Value == "test-sk"
	})).Return(mockOutput, nil)

	args := dynamo.DeleteItemArgs{
		Ctx: context.Background(),
		PK:  "test-pk",
		SK:  "test-sk",
	}

	result, err := dynamo.DeleteItem(table, args)

	assert.NoError(t, err)
	assert.True(t, result)
	mockClient.AssertExpectations(t)
}

func TestDeleteItem_Error(t *testing.T) {
	mockClient := &MockDynamoClient{}
	table := &dynamo.DynamoTable{
		DynamoClient: mockClient,
		TableName:    "test-table",
	}

	mockClient.On("DeleteItem", mock.Anything, mock.Anything).Return((*dynamodb.DeleteItemOutput)(nil), errors.New("delete error"))

	args := dynamo.DeleteItemArgs{
		Ctx: context.Background(),
		PK:  "test-pk",
		SK:  "test-sk",
	}

	result, err := dynamo.DeleteItem(table, args)

	assert.Error(t, err)
	assert.False(t, result)
	assert.Contains(t, err.Error(), "delete error")
	mockClient.AssertExpectations(t)
}
