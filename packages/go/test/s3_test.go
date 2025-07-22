package test

import (
	"bytes"
	"context"
	"errors"
	"io"
	"log"
	lumiS3 "lumi/pkg/s3"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	v4 "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockS3API implements S3API interface for testing
type MockS3API struct {
	mock.Mock
}

func (m *MockS3API) AbortMultipartUpload(ctx context.Context, params *s3.AbortMultipartUploadInput, optsFns ...func(*s3.Options)) (*s3.AbortMultipartUploadOutput, error) {
	args := m.Called(ctx, params, optsFns)
	return args.Get(0).(*s3.AbortMultipartUploadOutput), args.Error(1)
}

func (m *MockS3API) CompleteMultipartUpload(ctx context.Context, params *s3.CompleteMultipartUploadInput, optsFns ...func(*s3.Options)) (*s3.CompleteMultipartUploadOutput, error) {
	args := m.Called(ctx, params, optsFns)
	return args.Get(0).(*s3.CompleteMultipartUploadOutput), args.Error(1)
}

func (m *MockS3API) CopyObject(ctx context.Context, params *s3.CopyObjectInput, optFns ...func(*s3.Options)) (*s3.CopyObjectOutput, error) {
	args := m.Called(ctx, params, optFns)
	return args.Get(0).(*s3.CopyObjectOutput), args.Error(1)
}

func (m *MockS3API) CreateMultipartUpload(ctx context.Context, params *s3.CreateMultipartUploadInput, optsFns ...func(*s3.Options)) (*s3.CreateMultipartUploadOutput, error) {
	args := m.Called(ctx, params, optsFns)
	return args.Get(0).(*s3.CreateMultipartUploadOutput), args.Error(1)
}

func (m *MockS3API) DeleteObject(ctx context.Context, params *s3.DeleteObjectInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectOutput, error) {
	args := m.Called(ctx, params, optFns)
	return args.Get(0).(*s3.DeleteObjectOutput), args.Error(1)
}

func (m *MockS3API) DeleteObjects(ctx context.Context, params *s3.DeleteObjectsInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectsOutput, error) {
	args := m.Called(ctx, params, optFns)
	return args.Get(0).(*s3.DeleteObjectsOutput), args.Error(1)
}

func (m *MockS3API) GetObject(ctx context.Context, params *s3.GetObjectInput, optFns ...func(*s3.Options)) (*s3.GetObjectOutput, error) {
	args := m.Called(ctx, params, optFns)
	return args.Get(0).(*s3.GetObjectOutput), args.Error(1)
}

func (m *MockS3API) HeadObject(ctx context.Context, params *s3.HeadObjectInput, optFns ...func(*s3.Options)) (*s3.HeadObjectOutput, error) {
	args := m.Called(ctx, params, optFns)
	return args.Get(0).(*s3.HeadObjectOutput), args.Error(1)
}

func (m *MockS3API) ListMultipartUploads(ctx context.Context, params *s3.ListMultipartUploadsInput, optFns ...func(*s3.Options)) (*s3.ListMultipartUploadsOutput, error) {
	args := m.Called(ctx, params, optFns)
	return args.Get(0).(*s3.ListMultipartUploadsOutput), args.Error(1)
}

func (m *MockS3API) PutObject(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.Options)) (*s3.PutObjectOutput, error) {
	args := m.Called(ctx, params, optFns)
	return args.Get(0).(*s3.PutObjectOutput), args.Error(1)
}

func (m *MockS3API) UploadPart(ctx context.Context, params *s3.UploadPartInput, optFns ...func(*s3.Options)) (*s3.UploadPartOutput, error) {
	args := m.Called(ctx, params, optFns)
	return args.Get(0).(*s3.UploadPartOutput), args.Error(1)
}

func (m *MockS3API) UploadPartCopy(ctx context.Context, params *s3.UploadPartCopyInput, optFns ...func(*s3.Options)) (*s3.UploadPartCopyOutput, error) {
	args := m.Called(ctx, params, optFns)
	return args.Get(0).(*s3.UploadPartCopyOutput), args.Error(1)
}

// MockPresignAPI implements PresignAPI interface for testing
type MockPresignAPI struct {
	mock.Mock
}

func (m *MockPresignAPI) PresignGetObject(ctx context.Context, params *s3.GetObjectInput, optFns ...func(*s3.PresignOptions)) (*v4.PresignedHTTPRequest, error) {
	args := m.Called(ctx, params, optFns)
	return args.Get(0).(*v4.PresignedHTTPRequest), args.Error(1)
}

func (m *MockPresignAPI) PresignPutObject(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.PresignOptions)) (*v4.PresignedHTTPRequest, error) {
	args := m.Called(ctx, params, optFns)
	return args.Get(0).(*v4.PresignedHTTPRequest), args.Error(1)
}

func TestNewBucket(t *testing.T) {
	tests := []struct {
		name   string
		args   lumiS3.NewBucketArgs
		verify func(t *testing.T, bucket *lumiS3.S3Bucket)
	}{
		{
			name: "creates bucket with provided config",
			args: lumiS3.NewBucketArgs{
				BucketName: "test-bucket",
				Config:     &aws.Config{Region: "us-east-1"},
			},
			verify: func(t *testing.T, bucket *lumiS3.S3Bucket) {
				assert.Equal(t, "test-bucket", bucket.BucketName)
				assert.NotNil(t, bucket.S3Client)
				assert.NotNil(t, bucket.PresignClient)
				assert.NotNil(t, bucket.Logger)
			},
		},
		{
			name: "creates bucket with nil config",
			args: lumiS3.NewBucketArgs{
				BucketName: "test-bucket",
				Config:     nil,
			},
			verify: func(t *testing.T, bucket *lumiS3.S3Bucket) {
				assert.Equal(t, "test-bucket", bucket.BucketName)
				assert.NotNil(t, bucket.S3Client)
				assert.NotNil(t, bucket.PresignClient)
				assert.NotNil(t, bucket.Logger)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			bucket := lumiS3.NewBucket(tt.args)
			tt.verify(t, bucket)
		})
	}
}

func TestS3Bucket_UploadObject(t *testing.T) {
	tests := []struct {
		name    string
		args    lumiS3.UploadOjectArgs
		setup   func(*MockS3API)
		wantErr bool
	}{
		{
			name: "successful upload",
			args: lumiS3.UploadOjectArgs{
				Key:  "test-key",
				Body: strings.NewReader("test content"),
			},
			setup: func(m *MockS3API) {
				m.On("PutObject", mock.Anything, mock.MatchedBy(func(input *s3.PutObjectInput) bool {
					return *input.Key == "test-key" && *input.Bucket == "test-bucket"
				}), mock.Anything).Return(&s3.PutObjectOutput{}, nil)
			},
			wantErr: false,
		},
		{
			name: "upload error",
			args: lumiS3.UploadOjectArgs{
				Key:  "test-key",
				Body: strings.NewReader("test content"),
			},
			setup: func(m *MockS3API) {
				m.On("PutObject", mock.Anything, mock.Anything, mock.Anything).Return(&s3.PutObjectOutput{}, errors.New("upload failed"))
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockS3 := &MockS3API{}
			tt.setup(mockS3)

			bucket := &lumiS3.S3Bucket{
				S3Client:   mockS3,
				BucketName: "test-bucket",
				Logger:     log.New(os.Stdout, "test: ", log.LstdFlags),
			}

			result, err := bucket.UploadObject(context.Background(), tt.args)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, result)
			}

			mockS3.AssertExpectations(t)
		})
	}
}

func TestS3Bucket_UploadObjects(t *testing.T) {
	tests := []struct {
		name  string
		args  []lumiS3.UploadOjectArgs
		setup func(*MockS3API)
	}{
		{
			name: "successful bulk upload",
			args: []lumiS3.UploadOjectArgs{
				{Key: "key1", Body: strings.NewReader("content1")},
				{Key: "key2", Body: strings.NewReader("content2")},
			},
			setup: func(m *MockS3API) {
				m.On("PutObject", mock.Anything, mock.MatchedBy(func(input *s3.PutObjectInput) bool {
					return *input.Key == "key1"
				}), mock.Anything).Return(&s3.PutObjectOutput{}, nil)
				m.On("PutObject", mock.Anything, mock.MatchedBy(func(input *s3.PutObjectInput) bool {
					return *input.Key == "key2"
				}), mock.Anything).Return(&s3.PutObjectOutput{}, nil)
			},
		},
		{
			name: "mixed success and failure",
			args: []lumiS3.UploadOjectArgs{
				{Key: "key1", Body: strings.NewReader("content1")},
				{Key: "key2", Body: strings.NewReader("content2")},
			},
			setup: func(m *MockS3API) {
				m.On("PutObject", mock.Anything, mock.MatchedBy(func(input *s3.PutObjectInput) bool {
					return *input.Key == "key1"
				}), mock.Anything).Return(&s3.PutObjectOutput{}, nil)
				m.On("PutObject", mock.Anything, mock.MatchedBy(func(input *s3.PutObjectInput) bool {
					return *input.Key == "key2"
				}), mock.Anything).Return(&s3.PutObjectOutput{}, errors.New("upload failed"))
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockS3 := &MockS3API{}
			tt.setup(mockS3)

			bucket := &lumiS3.S3Bucket{
				S3Client:   mockS3,
				BucketName: "test-bucket",
				Logger:     log.New(os.Stdout, "test: ", log.LstdFlags),
			}

			results := bucket.UploadObjects(context.Background(), tt.args)
			assert.NotNil(t, results)

			mockS3.AssertExpectations(t)
		})
	}
}

func TestS3Bucket_GetObject(t *testing.T) {
	tests := []struct {
		name    string
		key     string
		setup   func(*MockS3API)
		wantErr bool
	}{
		{
			name: "successful get",
			key:  "test-key",
			setup: func(m *MockS3API) {
				m.On("GetObject", mock.Anything, mock.MatchedBy(func(input *s3.GetObjectInput) bool {
					return *input.Key == "test-key" && *input.Bucket == "test-bucket"
				}), mock.Anything).Return(&s3.GetObjectOutput{
					Body: io.NopCloser(strings.NewReader("test content")),
				}, nil)
			},
			wantErr: false,
		},
		{
			name: "get error",
			key:  "test-key",
			setup: func(m *MockS3API) {
				m.On("GetObject", mock.Anything, mock.Anything, mock.Anything).Return(&s3.GetObjectOutput{}, errors.New("get failed"))
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockS3 := &MockS3API{}
			tt.setup(mockS3)

			bucket := &lumiS3.S3Bucket{
				S3Client:   mockS3,
				BucketName: "test-bucket",
				Logger:     log.New(os.Stdout, "test: ", log.LstdFlags),
			}

			result, err := bucket.GetObject(context.Background(), tt.key)

			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, result)
			}

			mockS3.AssertExpectations(t)
		})
	}
}

func TestS3Bucket_GetBulkObjects(t *testing.T) {
	tests := []struct {
		name  string
		keys  []string
		setup func(*MockS3API)
	}{
		{
			name: "successful bulk get",
			keys: []string{"key1", "key2"},
			setup: func(m *MockS3API) {
				m.On("GetObject", mock.Anything, mock.MatchedBy(func(input *s3.GetObjectInput) bool {
					return *input.Key == "key1"
				}), mock.Anything).Return(&s3.GetObjectOutput{}, nil)
				m.On("GetObject", mock.Anything, mock.MatchedBy(func(input *s3.GetObjectInput) bool {
					return *input.Key == "key2"
				}), mock.Anything).Return(&s3.GetObjectOutput{}, nil)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockS3 := &MockS3API{}
			tt.setup(mockS3)

			bucket := &lumiS3.S3Bucket{
				S3Client:   mockS3,
				BucketName: "test-bucket",
				Logger:     log.New(os.Stdout, "test: ", log.LstdFlags),
			}

			results := bucket.GetBulkObjects(context.Background(), tt.keys)
			assert.NotNil(t, results)

			mockS3.AssertExpectations(t)
		})
	}
}

func TestS3Bucket_GetSignedGetURL(t *testing.T) {
	tests := []struct {
		name    string
		args    lumiS3.GetSignedURLArgs
		setup   func(*MockPresignAPI)
		wantErr bool
	}{
		{
			name: "successful presign get",
			args: lumiS3.GetSignedURLArgs{
				Key:         "test-key",
				ExpiresIn:   aws.Duration(time.Hour),
				ContentType: aws.String("image/jpeg"),
			},
			setup: func(m *MockPresignAPI) {
				m.On("PresignGetObject", mock.Anything, mock.MatchedBy(func(input *s3.GetObjectInput) bool {
					return *input.Key == "test-key" && *input.Bucket == "test-bucket"
				}), mock.Anything).Return(&v4.PresignedHTTPRequest{
					URL: "https://example.com/presigned-url",
				}, nil)
			},
			wantErr: false,
		},
		{
			name: "presign error",
			args: lumiS3.GetSignedURLArgs{Key: "test-key"},
			setup: func(m *MockPresignAPI) {
				m.On("PresignGetObject", mock.Anything, mock.Anything, mock.Anything).Return(&v4.PresignedHTTPRequest{}, errors.New("presign failed"))
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockPresign := &MockPresignAPI{}
			tt.setup(mockPresign)

			bucket := &lumiS3.S3Bucket{
				PresignClient: mockPresign,
				BucketName:    "test-bucket",
				Logger:        log.New(os.Stdout, "test: ", log.LstdFlags),
			}

			result, err := bucket.GetSignedGetURL(context.Background(), tt.args)

			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, result)
			}

			mockPresign.AssertExpectations(t)
		})
	}
}

func TestS3Bucket_GetSignedPutURL(t *testing.T) {
	tests := []struct {
		name    string
		args    lumiS3.GetSignedURLArgs
		setup   func(*MockPresignAPI)
		wantErr bool
	}{
		{
			name: "successful presign put",
			args: lumiS3.GetSignedURLArgs{
				Key:       "test-key",
				ExpiresIn: aws.Duration(time.Hour),
			},
			setup: func(m *MockPresignAPI) {
				m.On("PresignPutObject", mock.Anything, mock.MatchedBy(func(input *s3.PutObjectInput) bool {
					return *input.Key == "test-key" && *input.Bucket == "test-bucket"
				}), mock.Anything).Return(&v4.PresignedHTTPRequest{
					URL: "https://example.com/presigned-put-url",
				}, nil)
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockPresign := &MockPresignAPI{}
			tt.setup(mockPresign)

			bucket := &lumiS3.S3Bucket{
				PresignClient: mockPresign,
				BucketName:    "test-bucket",
				Logger:        log.New(os.Stdout, "test: ", log.LstdFlags),
			}

			result, err := bucket.GetSignedPutURL(context.Background(), tt.args)

			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, result)
			}

			mockPresign.AssertExpectations(t)
		})
	}
}

func TestS3Bucket_DeleteObject(t *testing.T) {
	tests := []struct {
		name    string
		key     string
		setup   func(*MockS3API)
		wantErr bool
	}{
		{
			name: "successful delete",
			key:  "test-key",
			setup: func(m *MockS3API) {
				m.On("DeleteObject", mock.Anything, mock.MatchedBy(func(input *s3.DeleteObjectInput) bool {
					return *input.Key == "test-key" && *input.Bucket == "test-bucket"
				}), mock.Anything).Return(&s3.DeleteObjectOutput{}, nil)
			},
			wantErr: false,
		},
		{
			name: "delete error",
			key:  "test-key",
			setup: func(m *MockS3API) {
				m.On("DeleteObject", mock.Anything, mock.Anything, mock.Anything).Return(&s3.DeleteObjectOutput{}, errors.New("delete failed"))
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockS3 := &MockS3API{}
			tt.setup(mockS3)

			bucket := &lumiS3.S3Bucket{
				S3Client:   mockS3,
				BucketName: "test-bucket",
				Logger:     log.New(os.Stdout, "test: ", log.LstdFlags),
			}

			result, err := bucket.DeleteObject(context.Background(), tt.key)

			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, result)
			}

			mockS3.AssertExpectations(t)
		})
	}
}

func TestS3Bucket_DeleteObjects(t *testing.T) {
	tests := []struct {
		name    string
		keys    []string
		setup   func(*MockS3API)
		wantErr bool
	}{
		{
			name: "successful bulk delete",
			keys: []string{"key1", "key2"},
			setup: func(m *MockS3API) {
				m.On("DeleteObjects", mock.Anything, mock.MatchedBy(func(input *s3.DeleteObjectsInput) bool {
					return *input.Bucket == "test-bucket" && len(input.Delete.Objects) == 2
				}), mock.Anything).Return(&s3.DeleteObjectsOutput{}, nil)
			},
			wantErr: false,
		},
		{
			name: "delete error",
			keys: []string{"key1"},
			setup: func(m *MockS3API) {
				m.On("DeleteObjects", mock.Anything, mock.Anything, mock.Anything).Return(&s3.DeleteObjectsOutput{}, errors.New("delete failed"))
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockS3 := &MockS3API{}
			tt.setup(mockS3)

			bucket := &lumiS3.S3Bucket{
				S3Client:   mockS3,
				BucketName: "test-bucket",
				Logger:     log.New(os.Stdout, "test: ", log.LstdFlags),
			}

			result, err := bucket.DeleteObjects(context.Background(), tt.keys)

			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, result)
			}

			mockS3.AssertExpectations(t)
		})
	}
}

func TestS3Bucket_CopyObject(t *testing.T) {
	dstBucket := &lumiS3.S3Bucket{BucketName: "dest-bucket"}

	tests := []struct {
		name    string
		args    lumiS3.CopyObjectArgs
		setup   func(*MockS3API)
		wantErr bool
	}{
		{
			name: "successful copy with destination key",
			args: lumiS3.CopyObjectArgs{
				DestinationBucket: *dstBucket,
				SourceKey:         "source-key",
				DestinationKey:    aws.String("dest-key"),
			},
			setup: func(m *MockS3API) {
				m.On("CopyObject", mock.Anything, mock.MatchedBy(func(input *s3.CopyObjectInput) bool {
					return *input.Bucket == "dest-bucket" &&
						*input.Key == "dest-key" &&
						*input.CopySource == "test-bucket/source-key"
				}), mock.Anything).Return(&s3.CopyObjectOutput{}, nil)
			},
			wantErr: false,
		},
		{
			name: "successful copy without destination key",
			args: lumiS3.CopyObjectArgs{
				DestinationBucket: *dstBucket,
				SourceKey:         "source-key",
				DestinationKey:    nil,
			},
			setup: func(m *MockS3API) {
				m.On("CopyObject", mock.Anything, mock.MatchedBy(func(input *s3.CopyObjectInput) bool {
					return *input.Bucket == "dest-bucket" &&
						*input.Key == "source-key" &&
						*input.CopySource == "test-bucket/source-key"
				}), mock.Anything).Return(&s3.CopyObjectOutput{}, nil)
			},
			wantErr: false,
		},
		{
			name: "copy error",
			args: lumiS3.CopyObjectArgs{
				DestinationBucket: *dstBucket,
				SourceKey:         "source-key",
			},
			setup: func(m *MockS3API) {
				m.On("CopyObject", mock.Anything, mock.Anything, mock.Anything).Return(&s3.CopyObjectOutput{}, errors.New("copy failed"))
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockS3 := &MockS3API{}
			tt.setup(mockS3)

			bucket := &lumiS3.S3Bucket{
				S3Client:   mockS3,
				BucketName: "test-bucket",
				Logger:     log.New(os.Stdout, "test: ", log.LstdFlags),
			}

			result, err := bucket.CopyObject(context.Background(), tt.args)

			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, result)
			}

			mockS3.AssertExpectations(t)
		})
	}
}

func TestS3Bucket_MoveObject(t *testing.T) {
	dstBucket := &lumiS3.S3Bucket{BucketName: "dest-bucket"}

	tests := []struct {
		name    string
		args    lumiS3.MoveObjectArgs
		setup   func(*MockS3API)
		wantErr bool
	}{
		{
			name: "successful move",
			args: lumiS3.MoveObjectArgs{
				DestinationBucket: *dstBucket,
				SourceKey:         "source-key",
			},
			setup: func(m *MockS3API) {
				// Copy operation
				m.On("CopyObject", mock.Anything, mock.MatchedBy(func(input *s3.CopyObjectInput) bool {
					return *input.Bucket == "dest-bucket" &&
						*input.Key == "source-key" &&
						*input.CopySource == "test-bucket/source-key"
				}), mock.Anything).Return(&s3.CopyObjectOutput{}, nil)

				// Delete operation
				m.On("DeleteObject", mock.Anything, mock.MatchedBy(func(input *s3.DeleteObjectInput) bool {
					return *input.Key == "source-key" && *input.Bucket == "test-bucket"
				}), mock.Anything).Return(&s3.DeleteObjectOutput{}, nil)
			},
			wantErr: false,
		},
		{
			name: "copy fails",
			args: lumiS3.MoveObjectArgs{
				DestinationBucket: *dstBucket,
				SourceKey:         "source-key",
			},
			setup: func(m *MockS3API) {
				m.On("CopyObject", mock.Anything, mock.Anything, mock.Anything).Return(&s3.CopyObjectOutput{}, errors.New("copy failed"))
			},
			wantErr: true,
		},
		{
			name: "delete fails after successful copy",
			args: lumiS3.MoveObjectArgs{
				DestinationBucket: *dstBucket,
				SourceKey:         "source-key",
			},
			setup: func(m *MockS3API) {
				m.On("CopyObject", mock.Anything, mock.Anything, mock.Anything).Return(&s3.CopyObjectOutput{}, nil)
				m.On("DeleteObject", mock.Anything, mock.Anything, mock.Anything).Return(&s3.DeleteObjectOutput{}, errors.New("delete failed"))
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockS3 := &MockS3API{}
			tt.setup(mockS3)

			bucket := &lumiS3.S3Bucket{
				S3Client:   mockS3,
				BucketName: "test-bucket",
				Logger:     log.New(os.Stdout, "test: ", log.LstdFlags),
			}

			result, err := bucket.MoveObject(context.Background(), tt.args)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, result)
				assert.NotNil(t, result.CopyResult)
				assert.NotNil(t, result.DeleteResult)
			}

			mockS3.AssertExpectations(t)
		})
	}
}

// Benchmark tests
func BenchmarkS3Bucket_UploadObject(b *testing.B) {
	mockS3 := &MockS3API{}
	mockS3.On("PutObject", mock.Anything, mock.Anything, mock.Anything).Return(&s3.PutObjectOutput{}, nil)

	bucket := &lumiS3.S3Bucket{
		S3Client:   mockS3,
		BucketName: "test-bucket",
		Logger:     log.New(io.Discard, "test: ", log.LstdFlags),
	}

	args := lumiS3.UploadOjectArgs{
		Key:  "test-key",
		Body: bytes.NewReader(make([]byte, 1024)),
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = bucket.UploadObject(context.Background(), args)
	}
}

func BenchmarkS3Bucket_GetObject(b *testing.B) {
	mockS3 := &MockS3API{}
	mockS3.On("GetObject", mock.Anything, mock.Anything, mock.Anything).Return(&s3.GetObjectOutput{
		Body: io.NopCloser(bytes.NewReader(make([]byte, 1024))),
	}, nil)

	bucket := &lumiS3.S3Bucket{
		S3Client:   mockS3,
		BucketName: "test-bucket",
		Logger:     log.New(io.Discard, "test: ", log.LstdFlags),
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = bucket.GetObject(context.Background(), "test-key")
	}
}
