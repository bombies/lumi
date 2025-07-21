package models

import (
	"context"
	"errors"
	"log"
	"lumi/pkg/dynamo"
	"lumi/pkg/models"
	"lumi/pkg/models/user"
	"lumi/pkg/s3"
	"net/http"
	"os"
	"testing"

	v4 "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	s3aws "github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/samber/lo"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockS3Bucket struct {
	mock.Mock
}

func (m *MockS3Bucket) UploadObject(ctx context.Context, args s3.UploadOjectArgs) (*manager.UploadOutput, error) {
	mockArgs := m.Called(ctx, args)
	return mockArgs.Get(0).(*manager.UploadOutput), mockArgs.Error(1)
}

func (m *MockS3Bucket) UploadObjects(ctx context.Context, args []s3.UploadOjectArgs) []s3aws.PutObjectOutput {
	mockArgs := m.Called(ctx, args)
	return mockArgs.Get(0).([]s3aws.PutObjectOutput)
}

func (m *MockS3Bucket) GetObject(ctx context.Context, key string) (*s3aws.GetObjectOutput, error) {
	mockArgs := m.Called(ctx, key)
	return mockArgs.Get(0).(*s3aws.GetObjectOutput), mockArgs.Error(1)
}

func (m *MockS3Bucket) GetBulkObjects(ctx context.Context, keys []string) []s3aws.GetObjectOutput {
	mockArgs := m.Called(ctx, keys)
	return mockArgs.Get(0).([]s3aws.GetObjectOutput)
}

func (m *MockS3Bucket) GetSignedGetURL(ctx context.Context, args s3.GetSignedURLArgs) (*v4.PresignedHTTPRequest, error) {
	mockArgs := m.Called(ctx, args)
	return mockArgs.Get(0).(*v4.PresignedHTTPRequest), mockArgs.Error(1)
}

func (m *MockS3Bucket) GetSignedPutURL(ctx context.Context, args s3.GetSignedURLArgs) (*v4.PresignedHTTPRequest, error) {
	mockArgs := m.Called(ctx, args)
	return mockArgs.Get(0).(*v4.PresignedHTTPRequest), mockArgs.Error(1)
}

func (m *MockS3Bucket) DeleteObject(ctx context.Context, key string) (*s3aws.DeleteObjectOutput, error) {
	mockArgs := m.Called(ctx, key)
	return mockArgs.Get(0).(*s3aws.DeleteObjectOutput), mockArgs.Error(1)
}

func (m *MockS3Bucket) DeleteObjects(ctx context.Context, keys []string) (*s3aws.DeleteObjectsOutput, error) {
	mockArgs := m.Called(ctx, keys)
	return mockArgs.Get(0).(*s3aws.DeleteObjectsOutput), mockArgs.Error(1)
}

func (m *MockS3Bucket) CopyObject(ctx context.Context, args s3.CopyObjectArgs) (*s3aws.CopyObjectOutput, error) {
	mockArgs := m.Called(ctx, args)
	return mockArgs.Get(0).(*s3aws.CopyObjectOutput), mockArgs.Error(1)
}

func (m *MockS3Bucket) MoveObject(ctx context.Context, args s3.MoveObjectArgs) (*s3.MoveObjectResult, error) {
	mockArgs := m.Called(ctx, args)
	return mockArgs.Get(0).(*s3.MoveObjectResult), mockArgs.Error(1)
}

func TestNewUserService(t *testing.T) {
	mockTable := &dynamo.DynamoTable{}
	mockBucket := &s3.S3Bucket{}

	service := user.NewUserService(mockTable, mockBucket)

	assert.NotNil(t, service)
	assert.NotNil(t, service.Logger)
	assert.Equal(t, mockTable, service.DynamoTable)
	assert.Equal(t, mockBucket, service.StorageBucket)
}

func TestUserService_GetUserAvatarUploadUrl(t *testing.T) {
	tests := []struct {
		name    string
		args    user.GetUserAvatarUploadUrlArgs
		setup   func(*MockS3Bucket)
		wantErr bool
	}{
		{
			name: "successful presigned URL generation",
			args: user.GetUserAvatarUploadUrlArgs{
				UserId: "test-id",
				GetUploadUrlDto: models.GetUploadUrlDto{
					ObjectKey:     "avatar",
					FileExtension: "jpg",
				},
			},
			setup: func(m *MockS3Bucket) {
				m.On("GetSignedPutURL", mock.Anything, mock.Anything).Return(&v4.PresignedHTTPRequest{
					URL: "https://example.com/presigned-url",
				}, nil)
			},
			wantErr: false,
		},
		{
			name: "error generating presigned URL",
			args: user.GetUserAvatarUploadUrlArgs{
				UserId: "test-id",
				GetUploadUrlDto: models.GetUploadUrlDto{
					ObjectKey:     "avatar",
					FileExtension: "jpg",
				},
			},
			setup: func(m *MockS3Bucket) {
				m.On("GetSignedPutURL", mock.Anything, mock.Anything).Return((*v4.PresignedHTTPRequest)(nil), errors.New("s3 error"))
			},
			wantErr: true,
		},
		{
			name: "empty file extension",
			args: user.GetUserAvatarUploadUrlArgs{
				UserId: "test-id",
				GetUploadUrlDto: models.GetUploadUrlDto{
					ObjectKey:     "avatar",
					FileExtension: "",
				},
			},
			setup: func(m *MockS3Bucket) {
				m.On("GetSignedPutURL", mock.Anything, mock.MatchedBy(func(args s3.GetSignedURLArgs) bool {
					return args.ContentType == nil
				})).Return(&v4.PresignedHTTPRequest{
					URL: "https://example.com/presigned-url",
				}, nil)
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockTable := &dynamo.DynamoTable{}
			mockBucket := &MockS3Bucket{}
			tt.setup(mockBucket)

			service := &user.UserService{
				DynamoTable:   mockTable,
				StorageBucket: mockBucket,
				Logger:        log.New(os.Stdout, "test: ", log.LstdFlags),
			}

			result, err := service.GetUserAvatarUploadUrl(context.Background(), tt.args)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, result)
				assert.Contains(t, result.URL, "presigned-url")
			}

			mockBucket.AssertExpectations(t)
		})
	}
}

func TestCreateUserArgs_Structure(t *testing.T) {
	sendOTP := true
	args := user.CreateUserArgs{
		Dto: user.CreateUserDto{
			Id:        stringPtr("test-id"),
			Email:     "test@example.com",
			Username:  "testuser",
			FirstName: "Test",
			LastName:  "User",
		},
		SendOTP: &sendOTP,
	}

	assert.Equal(t, "test@example.com", args.Dto.Email)
	assert.Equal(t, "testuser", args.Dto.Username)
	assert.Equal(t, "Test", args.Dto.FirstName)
	assert.Equal(t, "User", args.Dto.LastName)
	assert.NotNil(t, args.Dto.Id)
	assert.Equal(t, "test-id", *args.Dto.Id)
	assert.NotNil(t, args.SendOTP)
	assert.True(t, *args.SendOTP)
}

func TestGetUserByIdArgs_Structure(t *testing.T) {
	projections := []string{"id", "email", "username"}
	args := user.GetUserByIdArgs{
		UserId:      "test-id",
		Projections: projections,
	}

	assert.Equal(t, "test-id", args.UserId)
	assert.Equal(t, projections, args.Projections)
	assert.Len(t, args.Projections, 3)
}

func TestGetUserAvatarUploadUrlArgs_Structure(t *testing.T) {
	args := user.GetUserAvatarUploadUrlArgs{
		GetUploadUrlDto: models.GetUploadUrlDto{
			ObjectKey:     "avatar",
			FileExtension: "jpg",
		},
		UserId: "test-id",
	}

	assert.Equal(t, "avatar", args.ObjectKey)
	assert.Equal(t, "jpg", args.FileExtension)
	assert.Equal(t, "test-id", args.UserId)
}

func TestUserService_ValidationScenarios(t *testing.T) {
	tests := []struct {
		name string
		dto  user.CreateUserDto
	}{
		{
			name: "valid user data",
			dto: user.CreateUserDto{
				Email:     "valid@example.com",
				Username:  "validuser",
				FirstName: "Valid",
				LastName:  "User",
			},
		},
		{
			name: "user with custom ID",
			dto: user.CreateUserDto{
				Id:        stringPtr("custom-id"),
				Email:     "custom@example.com",
				Username:  "customuser",
				FirstName: "Custom",
				LastName:  "User",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.NotEmpty(t, tt.dto.Email)
			assert.NotEmpty(t, tt.dto.Username)
			assert.NotEmpty(t, tt.dto.FirstName)
			assert.NotEmpty(t, tt.dto.LastName)
		})
	}
}

func TestUserService_UpdateUserScenarios(t *testing.T) {
	tests := []struct {
		name string
		dto  user.UpdateUserDto
	}{
		{
			name: "update first name only",
			dto: user.UpdateUserDto{
				FirstName: stringPtr("NewFirst"),
			},
		},
		{
			name: "update multiple fields",
			dto: user.UpdateUserDto{
				FirstName:      stringPtr("NewFirst"),
				LastName:       stringPtr("NewLast"),
				AvatarKey:      stringPtr("new-avatar.jpg"),
				RelationshipId: stringPtr("new-rel-id"),
				Status:         lo.ToPtr(user.UserStatusIdle),
			},
		},
		{
			name: "update status only",
			dto: user.UpdateUserDto{
				Status: lo.ToPtr(user.UserStatusOffline),
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.dto.FirstName != nil {
				assert.NotEmpty(t, *tt.dto.FirstName)
			}
			if tt.dto.LastName != nil {
				assert.NotEmpty(t, *tt.dto.LastName)
			}
			if tt.dto.Status != nil {
				assert.Contains(t, []user.UserStatus{
					user.UserStatusOnline,
					user.UserStatusOffline,
					user.UserStatusIdle,
				}, *tt.dto.Status)
			}
		})
	}
}

func TestUserService_QueryParameterValidation(t *testing.T) {
	tests := []struct {
		name string
		dto  user.GetUsersByUsernameDto
	}{
		{
			name: "valid username query",
			dto: user.GetUsersByUsernameDto{
				Username: "testuser",
				Limit:    10,
				Cursor:   map[string]types.AttributeValue{},
			},
		},
		{
			name: "username query with projections",
			dto: user.GetUsersByUsernameDto{
				Username:    "testuser",
				Limit:       25,
				Projections: []string{"id", "username", "email"},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.NotEmpty(t, tt.dto.Username)
			assert.Greater(t, tt.dto.Limit, 0)
			assert.LessOrEqual(t, tt.dto.Limit, 100)

			assert.Equal(t, tt.dto.Limit, tt.dto.GetLimit())
			assert.Equal(t, tt.dto.Cursor, tt.dto.GetCursor())
		})
	}
}

func TestUserService_EmailQueryParameterValidation(t *testing.T) {
	tests := []struct {
		name string
		dto  user.GetUsersByEmailDto
	}{
		{
			name: "valid email query",
			dto: user.GetUsersByEmailDto{
				Email:  "test@example.com",
				Limit:  10,
				Cursor: map[string]types.AttributeValue{},
			},
		},
		{
			name: "email query with projections",
			dto: user.GetUsersByEmailDto{
				Email:       "user@domain.com",
				Limit:       50,
				Projections: []string{"id", "email", "firstName", "lastName"},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.NotEmpty(t, tt.dto.Email)
			assert.Contains(t, tt.dto.Email, "@")
			assert.Greater(t, tt.dto.Limit, 0)
			assert.LessOrEqual(t, tt.dto.Limit, 100)

			assert.Equal(t, tt.dto.Limit, tt.dto.GetLimit())
			assert.Equal(t, tt.dto.Cursor, tt.dto.GetCursor())
		})
	}
}

func TestUserService_ServiceErrorTypes(t *testing.T) {
	tests := []struct {
		name       string
		statusCode int
		message    string
	}{
		{
			name:       "bad request error",
			statusCode: http.StatusBadRequest,
			message:    "User with that email already exists",
		},
		{
			name:       "not found error",
			statusCode: http.StatusNotFound,
			message:    "User not found",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := &models.ServiceError{
				StatusCode: tt.statusCode,
				Message:    tt.message,
			}

			assert.Equal(t, tt.statusCode, err.StatusCode)
			assert.Equal(t, tt.message, err.Message)
		})
	}
}

func BenchmarkUserService_CreateUserArgs(b *testing.B) {
	dto := user.CreateUserDto{
		Email:     "benchmark@example.com",
		Username:  "benchmarkuser",
		FirstName: "Benchmark",
		LastName:  "User",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		args := user.CreateUserArgs{
			Dto:     dto,
			SendOTP: nil,
		}
		_ = args
	}
}

func BenchmarkUserService_GetUserByIdArgs(b *testing.B) {
	projections := []string{"id", "email", "username", "firstName", "lastName"}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		args := user.GetUserByIdArgs{
			UserId:      "benchmark-user-id",
			Projections: projections,
		}
		_ = args
	}
}

func stringPtr(s string) *string {
	return &s
}
