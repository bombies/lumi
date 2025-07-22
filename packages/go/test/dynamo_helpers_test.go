package test

import (
	"lumi/pkg/dynamo"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/stretchr/testify/assert"
)

type TestStruct struct {
	Name string `json:"name"`
	Age  int    `json:"age"`
}

func TestWrapAttributeValue_String(t *testing.T) {
	result := dynamo.WrapAttributeValue("test")
	expected := &types.AttributeValueMemberS{Value: "test"}
	assert.Equal(t, expected, result)
}

func TestWrapAttributeValue_Int(t *testing.T) {
	result := dynamo.WrapAttributeValue(42)
	expected := &types.AttributeValueMemberN{Value: "42"}
	assert.Equal(t, expected, result)
}

func TestWrapAttributeValue_Float(t *testing.T) {
	result := dynamo.WrapAttributeValue(3.14)
	expected := &types.AttributeValueMemberN{Value: "3.14"}
	assert.Equal(t, expected, result)
}

func TestWrapAttributeValue_Bool(t *testing.T) {
	result := dynamo.WrapAttributeValue(true)
	expected := &types.AttributeValueMemberBOOL{Value: true}
	assert.Equal(t, expected, result)
}

func TestWrapAttributeValue_Bytes(t *testing.T) {
	data := []byte("binary")
	result := dynamo.WrapAttributeValue(data)
	expected := &types.AttributeValueMemberB{Value: data}
	assert.Equal(t, expected, result)
}

func TestWrapAttributeValue_StringSlice(t *testing.T) {
	data := []string{"a", "b", "c"}
	result := dynamo.WrapAttributeValue(data)
	expected := &types.AttributeValueMemberSS{Value: data}
	assert.Equal(t, expected, result)
}

func TestWrapAttributeValue_List(t *testing.T) {
	data := []any{"test", 42}
	result := dynamo.WrapAttributeValue(data)
	expected := &types.AttributeValueMemberL{
		Value: []types.AttributeValue{
			&types.AttributeValueMemberS{Value: "test"},
			&types.AttributeValueMemberN{Value: "42"},
		},
	}
	assert.Equal(t, expected, result)
}

func TestWrapAttributeValue_Map(t *testing.T) {
	data := map[string]any{"name": "John", "age": 25}
	result := dynamo.WrapAttributeValue(data)
	expected := &types.AttributeValueMemberM{
		Value: map[string]types.AttributeValue{
			"name": &types.AttributeValueMemberS{Value: "John"},
			"age":  &types.AttributeValueMemberN{Value: "25"},
		},
	}
	assert.Equal(t, expected, result)
}

func TestWrapAttributeValue_Nil(t *testing.T) {
	result := dynamo.WrapAttributeValue(nil)
	expected := &types.AttributeValueMemberNULL{Value: true}
	assert.Equal(t, expected, result)
}

func TestWrapAttributeValue_Default(t *testing.T) {
	type CustomType struct{ Value string }
	data := CustomType{Value: "test"}
	result := dynamo.WrapAttributeValue(data)
	expected := &types.AttributeValueMemberS{Value: "{test}"}
	assert.Equal(t, expected, result)
}

func TestWrapAttributes(t *testing.T) {
	data := map[string]any{
		"name":   "John",
		"age":    25,
		"active": true,
	}
	result := dynamo.WrapAttributes(data)
	expected := map[string]types.AttributeValue{
		"name":   &types.AttributeValueMemberS{Value: "John"},
		"age":    &types.AttributeValueMemberN{Value: "25"},
		"active": &types.AttributeValueMemberBOOL{Value: true},
	}
	assert.Equal(t, expected, result)
}

func TestStructToAttributeMap_Success(t *testing.T) {
	item := TestStruct{Name: "John", Age: 25}
	result, err := dynamo.StructToAttributeMap(item)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, &types.AttributeValueMemberS{Value: "John"}, result["name"])
	assert.Equal(t, &types.AttributeValueMemberN{Value: "25"}, result["age"])
}

func TestAttributeMapToStruct_Success(t *testing.T) {
	attrs := map[string]types.AttributeValue{
		"name": &types.AttributeValueMemberS{Value: "John"},
		"age":  &types.AttributeValueMemberN{Value: "25"},
	}
	result, err := dynamo.AttributeMapToStruct[TestStruct](attrs)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "John", result.Name)
	assert.Equal(t, 25, result.Age)
}

type TestUpdateStruct struct {
	Name dynamo.UpdateableDynamoField[string] `json:"name"`
	Age  dynamo.UpdateableDynamoField[int]    `json:"age"`
}

func (t TestUpdateStruct) GetUpdateTag() string {
	return "test"
}

func TestGetDynamicUpdateStatements_SetOnly(t *testing.T) {
	obj := TestUpdateStruct{
		Name: dynamo.NewUpdateValue("John"),
		Age:  dynamo.NewUpdateValue(30),
	}
	result, err := dynamo.GetDynamicUpdateStatements(obj)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Contains(t, result.UpdateStatements, "#name = :name")
	assert.Contains(t, result.UpdateStatements, "#age = :age")
	assert.Equal(t, "name", result.ExpressionAttributeNames["#name"])
	assert.Equal(t, "age", result.ExpressionAttributeNames["#age"])
}

func TestGetDynamicUpdateStatements_RemoveOnly(t *testing.T) {
	obj := TestUpdateStruct{
		Name: dynamo.NewRemoveValue[string](),
		Age:  dynamo.NewRemoveValue[int](),
	}

	result, err := dynamo.GetDynamicUpdateStatements(obj)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Contains(t, result.UpdateStatements, "REMOVE")
	assert.NotContains(t, result.UpdateStatements, "SET")
	assert.Contains(t, result.UpdateStatements, "#name")
	assert.Contains(t, result.UpdateStatements, "#age")
	assert.Equal(t, "name", result.ExpressionAttributeNames["#name"])
	assert.Equal(t, "age", result.ExpressionAttributeNames["#age"])
}

func TestGetDynamicUpdateStatements_Mixed(t *testing.T) {
	obj := TestUpdateStruct{
		Name: dynamo.NewUpdateValue("John"),
		Age:  dynamo.NewRemoveValue[int](),
	}

	result, err := dynamo.GetDynamicUpdateStatements(obj)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Contains(t, result.UpdateStatements, "SET #name = :name")
	assert.Contains(t, result.UpdateStatements, "REMOVE #age")
}

func TestGetUpdateParams_Success(t *testing.T) {
	tableName := "test-table"
	args := dynamo.UpdateItemArgs{
		PK: "test-pk",
		SK: "test-sk",
		UpdateBody: TestUpdateStruct{
			Name: dynamo.NewUpdateValue("John"),
			Age:  dynamo.NewUpdateValue(30),
		},
	}

	result, err := dynamo.GetUpdateParams(&tableName, args)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, &tableName, result.TableName)
	assert.Equal(t, "test-pk", result.Key["pk"].(*types.AttributeValueMemberS).Value)
	assert.Equal(t, "test-sk", result.Key["sk"].(*types.AttributeValueMemberS).Value)
	assert.NotNil(t, result.UpdateExpression)
	assert.Equal(t, types.ReturnValueAllNew, result.ReturnValues)
}

func TestUnwrapItems_WithMapper(t *testing.T) {
	items := []map[string]types.AttributeValue{
		{
			"name": &types.AttributeValueMemberS{Value: "john"},
			"age":  &types.AttributeValueMemberN{Value: "25"},
		},
	}

	mapper := func(item TestStruct) TestStruct {
		item.Name = "JOHN"
		return item
	}

	result := dynamo.UnwrapItems(items, mapper)

	assert.Len(t, result, 1)
	assert.Equal(t, "JOHN", result[0].Name)
	assert.Equal(t, 25, result[0].Age)
}

func TestUnwrapItems_WithoutMapper(t *testing.T) {
	items := []map[string]types.AttributeValue{
		{
			"name": &types.AttributeValueMemberS{Value: "John"},
			"age":  &types.AttributeValueMemberN{Value: "25"},
		},
	}

	result := dynamo.UnwrapItems[TestStruct](items, nil)

	assert.Len(t, result, 1)
	assert.Equal(t, "John", result[0].Name)
	assert.Equal(t, 25, result[0].Age)
}

func TestUnwrapAttributeValue_String(t *testing.T) {
	attr := &types.AttributeValueMemberS{Value: "test"}
	result := dynamo.UnwrapAttributeValue(attr)
	assert.Equal(t, "test", result)
}

func TestUnwrapAttributeValue_Number(t *testing.T) {
	attr := &types.AttributeValueMemberN{Value: "123.45"}
	result := dynamo.UnwrapAttributeValue(attr)
	assert.Equal(t, 123.45, result)
}

func TestUnwrapAttributeValue_NumberInvalid(t *testing.T) {
	attr := &types.AttributeValueMemberN{Value: "invalid"}
	result := dynamo.UnwrapAttributeValue(attr)
	assert.Equal(t, "invalid", result)
}

func TestUnwrapAttributeValue_Bool(t *testing.T) {
	attr := &types.AttributeValueMemberBOOL{Value: true}
	result := dynamo.UnwrapAttributeValue(attr)
	assert.Equal(t, true, result)
}

func TestUnwrapAttributeValue_Null(t *testing.T) {
	attr := &types.AttributeValueMemberNULL{Value: true}
	result := dynamo.UnwrapAttributeValue(attr)
	assert.Nil(t, result)
}

func TestUnwrapAttributeValue_Binary(t *testing.T) {
	data := []byte("binary data")
	attr := &types.AttributeValueMemberB{Value: data}
	result := dynamo.UnwrapAttributeValue(attr)
	assert.Equal(t, data, result)
}

func TestUnwrapAttributeValue_StringSet(t *testing.T) {
	attr := &types.AttributeValueMemberSS{Value: []string{"a", "b", "c"}}
	result := dynamo.UnwrapAttributeValue(attr)
	assert.Equal(t, []string{"a", "b", "c"}, result)
}

func TestUnwrapAttributeValue_NumberSet(t *testing.T) {
	attr := &types.AttributeValueMemberNS{Value: []string{"1", "2.5", "3"}}
	result := dynamo.UnwrapAttributeValue(attr)
	assert.Equal(t, []float64{1, 2.5, 3}, result)
}

func TestUnwrapAttributeValue_List(t *testing.T) {
	attr := &types.AttributeValueMemberL{
		Value: []types.AttributeValue{
			&types.AttributeValueMemberS{Value: "test"},
			&types.AttributeValueMemberN{Value: "123"},
		},
	}
	result := dynamo.UnwrapAttributeValue(attr)
	expected := []any{"test", float64(123)}
	assert.Equal(t, expected, result)
}

func TestUnwrapAttributeValue_Map(t *testing.T) {
	attr := &types.AttributeValueMemberM{
		Value: map[string]types.AttributeValue{
			"name": &types.AttributeValueMemberS{Value: "John"},
			"age":  &types.AttributeValueMemberN{Value: "25"},
		},
	}
	result := dynamo.UnwrapAttributeValue(attr)
	expected := map[string]any{
		"name": "John",
		"age":  float64(25),
	}
	assert.Equal(t, expected, result)
}

func TestUnwrapAttributeValue_Unknown(t *testing.T) {
	// This tests the default case
	result := dynamo.UnwrapAttributeValue(nil)
	assert.Nil(t, result)
}

func TestUnwrapAttributes(t *testing.T) {
	attrs := map[string]types.AttributeValue{
		"id":     &types.AttributeValueMemberS{Value: "1"},
		"name":   &types.AttributeValueMemberS{Value: "John"},
		"age":    &types.AttributeValueMemberN{Value: "25"},
		"active": &types.AttributeValueMemberBOOL{Value: true},
	}

	result := dynamo.UnwrapAttributes(attrs)

	expected := map[string]any{
		"id":     "1",
		"name":   "John",
		"age":    float64(25),
		"active": true,
	}

	assert.Equal(t, expected, result)
}
