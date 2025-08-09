package test

import (
	"lumi/pkg/utils"
	"testing"

	"github.com/stretchr/testify/assert"
)

type TestPerson struct {
	Name string `json:"name"`
	Age  int    `json:"age"`
}

func TestMapToStruct_Success(t *testing.T) {
	data := map[string]any{
		"name": "John",
		"age":  25,
	}

	result, err := utils.MapToStruct[TestPerson](data)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "John", result.Name)
	assert.Equal(t, 25, result.Age)
}

func TestMapToStruct_EmptyMap(t *testing.T) {
	data := map[string]any{}

	result, err := utils.MapToStruct[TestPerson](data)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "", result.Name)
	assert.Equal(t, 0, result.Age)
}

func TestMapToStruct_InvalidData(t *testing.T) {
	data := map[string]any{
		"name": "John",
		"age":  "invalid",
	}

	result, err := utils.MapToStruct[TestPerson](data)

	assert.Error(t, err)
	assert.Nil(t, result)
}

func TestStructToMap_Success(t *testing.T) {
	person := TestPerson{
		Name: "John",
		Age:  25,
	}

	result, err := utils.StructToMap(person)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "John", result["name"])
	assert.Equal(t, float64(25), result["age"])
}

func TestStructToMap_NonStruct(t *testing.T) {
	notStruct := "not a struct"

	result, err := utils.StructToMap(notStruct)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "item is not a struct")
}

func TestStructToMap_Pointer(t *testing.T) {
	person := &TestPerson{
		Name: "John",
		Age:  25,
	}

	result, err := utils.StructToMap(person)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "item is not a struct")
}
