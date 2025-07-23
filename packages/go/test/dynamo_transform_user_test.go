package test

import (
	"lumi/pkg/dynamo"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// Test DTO similar to UpdateUserDto
type UserUpdateDTO struct {
	FirstName *string `json:"firstName"`
	LastName  *string `json:"lastName"`
	Status    *string `json:"status"`
}

// Test record similar to UpdateableUserRecord
type UserUpdateRecord struct {
	FirstName dynamo.UpdateableDynamoField[string]    `json:"firstName"`
	LastName  dynamo.UpdateableDynamoField[string]    `json:"lastName"`
	Status    dynamo.UpdateableDynamoField[string]    `json:"status"`
	UpdatedAt dynamo.UpdateableDynamoField[time.Time] `json:"updatedAt"`
}

func (r UserUpdateRecord) GetUpdateTag() string {
	return "user-update-record"
}

func TestTransformToUpdateable_UserExample(t *testing.T) {
	// Setup test data
	firstName := "John"
	lastName := "Doe"
	status := "active"
	
	dto := UserUpdateDTO{
		FirstName: &firstName,
		LastName:  &lastName,
		Status:    &status,
	}
	
	var record UserUpdateRecord
	
	// Execute the function
	err := dynamo.TransformToUpdateable(dto, &record)
	
	// Verify results
	assert.NoError(t, err)
	assert.NotNil(t, record.FirstName.Value)
	assert.Equal(t, firstName, *record.FirstName.Value)
	assert.NotNil(t, record.LastName.Value)
	assert.Equal(t, lastName, *record.LastName.Value)
	assert.NotNil(t, record.Status.Value)
	assert.Equal(t, status, *record.Status.Value)
	assert.Nil(t, record.UpdatedAt.Value) // Not set by the DTO
}