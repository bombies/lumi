package test

import (
	"lumi/pkg/dynamo"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// Test DTO struct with pointer fields
type TestDTO struct {
	Name      *string  `json:"name"`
	Age       *int     `json:"age"`
	Active    *bool    `json:"active"`
	Score     *float64 `json:"score"`
	CreatedAt *time.Time
	// Field that doesn't exist in the target struct
	NonExistent *string `json:"nonExistent"`
}

// Target struct with UpdateableDynamoField fields
type TestUpdateableRecord struct {
	Name      dynamo.UpdateableDynamoField[string]    `json:"name"`
	Age       dynamo.UpdateableDynamoField[int]       `json:"age"`
	Active    dynamo.UpdateableDynamoField[bool]      `json:"active"`
	Score     dynamo.UpdateableDynamoField[float64]   `json:"score"`
	CreatedAt dynamo.UpdateableDynamoField[time.Time] `json:"createdAt"`
}

func (t TestUpdateableRecord) GetUpdateTag() string {
	return "test-updateable-record"
}

func TestTransformToUpdateable_Success(t *testing.T) {
	// Setup test data
	name := "John"
	age := 30
	active := true
	score := 95.5
	now := time.Now()

	dto := TestDTO{
		Name:      &name,
		Age:       &age,
		Active:    &active,
		Score:     &score,
		CreatedAt: &now,
	}

	var record TestUpdateableRecord

	// Execute the function
	err := dynamo.TransformToUpdateable(dto, &record)

	// Verify results
	assert.NoError(t, err)
	assert.NotNil(t, record.Name.Value)
	assert.Equal(t, name, *record.Name.Value)
	assert.NotNil(t, record.Age.Value)
	assert.Equal(t, age, *record.Age.Value)
	assert.NotNil(t, record.Active.Value)
	assert.Equal(t, active, *record.Active.Value)
	assert.NotNil(t, record.Score.Value)
	assert.Equal(t, score, *record.Score.Value)
	assert.NotNil(t, record.CreatedAt.Value)
	assert.Equal(t, now, *record.CreatedAt.Value)
}

func TestTransformToUpdateable_NilFields(t *testing.T) {
	// Setup test data with nil fields
	name := "John"
	dto := TestDTO{
		Name: &name,
		// All other fields are nil
	}

	var record TestUpdateableRecord

	// Execute the function
	err := dynamo.TransformToUpdateable(dto, &record)

	// Verify results
	assert.NoError(t, err)
	assert.NotNil(t, record.Name.Value)
	assert.Equal(t, name, *record.Name.Value)
	assert.Nil(t, record.Age.Value)
	assert.Nil(t, record.Active.Value)
	assert.Nil(t, record.Score.Value)
	assert.Nil(t, record.CreatedAt.Value)
}

func TestTransformToUpdateable_EmptyDTO(t *testing.T) {
	// Setup empty DTO
	dto := TestDTO{}

	var record TestUpdateableRecord

	// Execute the function
	err := dynamo.TransformToUpdateable(dto, &record)

	// Verify results
	assert.NoError(t, err)
	assert.Nil(t, record.Name.Value)
	assert.Nil(t, record.Age.Value)
	assert.Nil(t, record.Active.Value)
	assert.Nil(t, record.Score.Value)
	assert.Nil(t, record.CreatedAt.Value)
}

func TestTransformToUpdateable_NonPointerRecord(t *testing.T) {
	// Setup test data
	name := "John"
	dto := TestDTO{
		Name: &name,
	}

	// Create a non-pointer record
	record := TestUpdateableRecord{}

	// Execute the function with non-pointer record
	err := dynamo.TransformToUpdateable(dto, record)

	// Verify error
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "dst must be a pointer to a struct")
}

func TestTransformToUpdateable_MismatchedTypes(t *testing.T) {
	// Setup test data with a field name that doesn't exist in the target
	type MismatchDTO struct {
		// Field that doesn't exist in the target record
		NonExistentField *string `json:"nonExistentField"`
	}

	value := "test"
	dto := MismatchDTO{
		NonExistentField: &value,
	}

	var record TestUpdateableRecord

	// Execute the function
	err := dynamo.TransformToUpdateable(dto, &record)

	// This should not error, the non-existent field is just ignored
	assert.NoError(t, err)
	// Verify none of the fields were affected
	assert.Nil(t, record.Name.Value)
	assert.Nil(t, record.Age.Value)
}

// Real-world example moved to dynamo_transform_user_test.go
