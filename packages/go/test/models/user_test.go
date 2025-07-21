package models

import (
	"lumi/pkg/dynamo"
	"lumi/pkg/models/user"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestUserStatus_Constants(t *testing.T) {
	tests := []struct {
		name     string
		status   user.UserStatus
		expected string
	}{
		{"online status", user.UserStatusOnline, "online"},
		{"offline status", user.UserStatusOffline, "offline"},
		{"idle status", user.UserStatusIdle, "idle"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.expected, string(tt.status))
		})
	}
}

func TestEntityTypeUserRecord(t *testing.T) {
	assert.Equal(t, dynamo.EntityType("USER"), user.EntityTypeUserRecord)
}

func TestUserRecord_GetPK(t *testing.T) {
	tests := []struct {
		name     string
		userRec  user.UserRecord
		expected string
	}{
		{
			name: "returns correct PK",
			userRec: user.UserRecord{
				DynamoPrimaryKey: dynamo.DynamoPrimaryKey{
					PK: "user#123",
					SK: "user#123",
				},
			},
			expected: "user#123",
		},
		{
			name: "returns empty PK",
			userRec: user.UserRecord{
				DynamoPrimaryKey: dynamo.DynamoPrimaryKey{
					PK: "",
					SK: "user#123",
				},
			},
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.userRec.GetPK()
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestUserRecord_GetSK(t *testing.T) {
	tests := []struct {
		name     string
		userRec  user.UserRecord
		expected string
	}{
		{
			name: "returns correct SK",
			userRec: user.UserRecord{
				DynamoPrimaryKey: dynamo.DynamoPrimaryKey{
					PK: "user#123",
					SK: "user#456",
				},
			},
			expected: "user#456",
		},
		{
			name: "returns empty SK",
			userRec: user.UserRecord{
				DynamoPrimaryKey: dynamo.DynamoPrimaryKey{
					PK: "user#123",
					SK: "",
				},
			},
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.userRec.GetSK()
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestUserRecord_GetGSI1(t *testing.T) {
	tests := []struct {
		name       string
		userRec    user.UserRecord
		expectedPK string
		expectedSK string
	}{
		{
			name: "returns correct GSI1 keys",
			userRec: user.UserRecord{
				DynamoGSI1Keys: dynamo.DynamoGSI1Keys{
					GSI1PK: "user#username",
					GSI1SK: "user#john_doe",
				},
			},
			expectedPK: "user#username",
			expectedSK: "user#john_doe",
		},
		{
			name: "returns empty GSI1 keys",
			userRec: user.UserRecord{
				DynamoGSI1Keys: dynamo.DynamoGSI1Keys{
					GSI1PK: "",
					GSI1SK: "",
				},
			},
			expectedPK: "",
			expectedSK: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			pk, sk := tt.userRec.GetGSI1()
			assert.NotNil(t, pk)
			assert.NotNil(t, sk)
			assert.Equal(t, tt.expectedPK, *pk)
			assert.Equal(t, tt.expectedSK, *sk)
		})
	}
}

func TestUserRecord_GetGSI2(t *testing.T) {
	tests := []struct {
		name       string
		userRec    user.UserRecord
		expectedPK string
		expectedSK string
	}{
		{
			name: "returns correct GSI2 keys",
			userRec: user.UserRecord{
				DynamoGSI2Keys: dynamo.DynamoGSI2Keys{
					GSI2PK: "user#email",
					GSI2SK: "user#john@example.com",
				},
			},
			expectedPK: "user#email",
			expectedSK: "user#john@example.com",
		},
		{
			name: "returns empty GSI2 keys",
			userRec: user.UserRecord{
				DynamoGSI2Keys: dynamo.DynamoGSI2Keys{
					GSI2PK: "",
					GSI2SK: "",
				},
			},
			expectedPK: "",
			expectedSK: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			pk, sk := tt.userRec.GetGSI2()
			assert.NotNil(t, pk)
			assert.NotNil(t, sk)
			assert.Equal(t, tt.expectedPK, *pk)
			assert.Equal(t, tt.expectedSK, *sk)
		})
	}
}

func TestUserKeys_BuildKey(t *testing.T) {
	keys := user.UserKeys{}

	tests := []struct {
		name     string
		suffixes []string
		expected string
	}{
		{
			name:     "builds key with single suffix",
			suffixes: []string{"123"},
			expected: "user#123",
		},
		{
			name:     "builds key with multiple suffixes",
			suffixes: []string{"123", "profile"},
			expected: "user#123#profile",
		},
		{
			name:     "builds key with no suffixes",
			suffixes: []string{},
			expected: "user",
		},
		{
			name:     "builds key with empty suffix",
			suffixes: []string{""},
			expected: "user#",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := keys.BuildKey(tt.suffixes...)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestUserKeys_PK(t *testing.T) {
	keys := user.UserKeys{}

	tests := []struct {
		name     string
		userId   string
		expected string
	}{
		{
			name:     "builds PK with valid user ID",
			userId:   "123",
			expected: "user#123",
		},
		{
			name:     "builds PK with empty user ID",
			userId:   "",
			expected: "user#",
		},
		{
			name:     "builds PK with UUID",
			userId:   "550e8400-e29b-41d4-a716-446655440000",
			expected: "user#550e8400-e29b-41d4-a716-446655440000",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := keys.PK(tt.userId)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestUserKeys_SK(t *testing.T) {
	keys := user.UserKeys{}

	tests := []struct {
		name     string
		userId   string
		expected string
	}{
		{
			name:     "builds SK with valid user ID",
			userId:   "123",
			expected: "user#123",
		},
		{
			name:     "builds SK with empty user ID",
			userId:   "",
			expected: "user#",
		},
		{
			name:     "builds SK with UUID",
			userId:   "550e8400-e29b-41d4-a716-446655440000",
			expected: "user#550e8400-e29b-41d4-a716-446655440000",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := keys.SK(tt.userId)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestUserKeys_GSI1PK(t *testing.T) {
	keys := user.UserKeys{}
	expected := "user#username"

	result := keys.GSI1PK()
	assert.Equal(t, expected, result)
}

func TestUserKeys_GSI1SK(t *testing.T) {
	keys := user.UserKeys{}

	tests := []struct {
		name     string
		username string
		expected string
	}{
		{
			name:     "builds GSI1SK with valid username",
			username: "john_doe",
			expected: "user#john_doe",
		},
		{
			name:     "builds GSI1SK with empty username",
			username: "",
			expected: "user#",
		},
		{
			name:     "builds GSI1SK with special characters",
			username: "user@domain.com",
			expected: "user#user@domain.com",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := keys.GSI1SK(tt.username)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestUserKeys_GSI2PK(t *testing.T) {
	keys := user.UserKeys{}
	expected := "user#email"

	result := keys.GSI2PK()
	assert.Equal(t, expected, result)
}

func TestUserKeys_GSI2SK(t *testing.T) {
	keys := user.UserKeys{}

	tests := []struct {
		name     string
		email    string
		expected string
	}{
		{
			name:     "builds GSI2SK with valid email",
			email:    "john@example.com",
			expected: "user#john@example.com",
		},
		{
			name:     "builds GSI2SK with empty email",
			email:    "",
			expected: "user#",
		},
		{
			name:     "builds GSI2SK with complex email",
			email:    "user.name+tag@domain.co.uk",
			expected: "user#user.name+tag@domain.co.uk",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := keys.GSI2SK(tt.email)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestUserKeyPrefix(t *testing.T) {
	assert.Equal(t, "user", user.UserKeyPrefix)
}

func TestUserRecord_CompleteStruct(t *testing.T) {
	now := time.Now()
	avatarUrl := "https://example.com/avatar.jpg"

	userRec := user.UserRecord{
		DynamoPrimaryKey: dynamo.DynamoPrimaryKey{
			PK: "user#123",
			SK: "user#123",
		},
		DynamoGSI1Keys: dynamo.DynamoGSI1Keys{
			GSI1PK: "user#username",
			GSI1SK: "user#john_doe",
		},
		DynamoGSI2Keys: dynamo.DynamoGSI2Keys{
			GSI2PK: "user#email",
			GSI2SK: "user#john@example.com",
		},
		DynamoEntityType: dynamo.DynamoEntityType{
			EntityType: user.EntityTypeUserRecord,
		},
		Id:             "123",
		Email:          "john@example.com",
		Username:       "john_doe",
		FirstName:      "John",
		LastName:       "Doe",
		CreatedAt:      now,
		UpdatedAt:      now,
		AvatarKey:      "avatars/123.jpg",
		AvatarUrl:      &avatarUrl,
		RelationshipId: "rel_456",
		Status:         user.UserStatusOnline,
	}

	// Test all fields are properly set
	assert.Equal(t, "user#123", userRec.GetPK())
	assert.Equal(t, "user#123", userRec.GetSK())

	gsi1PK, gsi1SK := userRec.GetGSI1()
	assert.Equal(t, "user#username", *gsi1PK)
	assert.Equal(t, "user#john_doe", *gsi1SK)

	gsi2PK, gsi2SK := userRec.GetGSI2()
	assert.Equal(t, "user#email", *gsi2PK)
	assert.Equal(t, "user#john@example.com", *gsi2SK)

	assert.Equal(t, "123", userRec.Id)
	assert.Equal(t, "john@example.com", userRec.Email)
	assert.Equal(t, "john_doe", userRec.Username)
	assert.Equal(t, "John", userRec.FirstName)
	assert.Equal(t, "Doe", userRec.LastName)
	assert.Equal(t, now, userRec.CreatedAt)
	assert.Equal(t, now, userRec.UpdatedAt)
	assert.Equal(t, "avatars/123.jpg", userRec.AvatarKey)
	assert.Equal(t, &avatarUrl, userRec.AvatarUrl)
	assert.Equal(t, "rel_456", userRec.RelationshipId)
	assert.Equal(t, user.UserStatusOnline, userRec.Status)
	assert.Equal(t, user.EntityTypeUserRecord, userRec.EntityType)
}

func TestUpdateableUserRecord_Structure(t *testing.T) {
	now := time.Now()

	updateRec := user.UpdateableUserRecord{
		FirstName:      dynamo.NewUpdateValue("John"),
		LastName:       dynamo.NewUpdateValue("Doe"),
		AvatarKey:      dynamo.NewUpdateValue("avatars/new.jpg"),
		RelationshipId: dynamo.NewUpdateValue("rel_789"),
		Status:         dynamo.NewUpdateValue(user.UserStatusIdle),
		UpdatedAt:      dynamo.NewUpdateValue(now),
	}

	// Test all updateable fields
	assert.Equal(t, "John", *updateRec.FirstName.Value)

	assert.Equal(t, "Doe", *updateRec.LastName.Value)

	assert.Equal(t, "avatars/new.jpg", *updateRec.AvatarKey.Value)

	assert.Equal(t, "rel_789", *updateRec.RelationshipId.Value)

	assert.Equal(t, user.UserStatusIdle, *updateRec.Status.Value)

	assert.Equal(t, now, *updateRec.UpdatedAt.Value)
}

// Benchmark tests
func BenchmarkUserKeys_PK(b *testing.B) {
	keys := user.UserKeys{}
	userId := "550e8400-e29b-41d4-a716-446655440000"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = keys.PK(userId)
	}
}

func BenchmarkUserKeys_BuildKey(b *testing.B) {
	keys := user.UserKeys{}
	suffixes := []string{"123", "profile", "data"}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = keys.BuildKey(suffixes...)
	}
}

func BenchmarkUserRecord_GetPK(b *testing.B) {
	userRec := user.UserRecord{
		DynamoPrimaryKey: dynamo.DynamoPrimaryKey{
			PK: "user#550e8400-e29b-41d4-a716-446655440000",
			SK: "user#550e8400-e29b-41d4-a716-446655440000",
		},
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = userRec.GetPK()
	}
}

func BenchmarkUserRecord_GetGSI1(b *testing.B) {
	userRec := user.UserRecord{
		DynamoGSI1Keys: dynamo.DynamoGSI1Keys{
			GSI1PK: "user#username",
			GSI1SK: "user#john_doe_with_long_username",
		},
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = userRec.GetGSI1()
	}
}
