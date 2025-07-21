package s3

import (
	"io"
	"time"

	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type UploadOjectArgs struct {
	Key  string
	Body io.Reader
}

type GetSignedURLArgs struct {
	Key         string
	ExpiresIn   *time.Duration
	ContentType *string
}

type CopyObjectArgs struct {
	DestinationBucket S3Bucket
	SourceKey         string
	DestinationKey    *string
}

type MoveObjectArgs struct {
	DestinationBucket S3Bucket
	SourceKey         string
	DestinationKey    *string
}

type MoveObjectResult struct {
	CopyResult   *s3.CopyObjectOutput
	DeleteResult *s3.DeleteObjectOutput
}
