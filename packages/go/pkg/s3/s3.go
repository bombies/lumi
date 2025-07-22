package s3

import (
	"context"
	"fmt"
	"log"
	"lumi/pkg/utils"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	v4 "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/samber/lo"
)

type S3API interface {
	AbortMultipartUpload(ctx context.Context, params *s3.AbortMultipartUploadInput, optsFns ...func(*s3.Options)) (*s3.AbortMultipartUploadOutput, error)
	CompleteMultipartUpload(ctx context.Context, params *s3.CompleteMultipartUploadInput, optsFns ...func(*s3.Options)) (*s3.CompleteMultipartUploadOutput, error)
	CopyObject(ctx context.Context, params *s3.CopyObjectInput, optFns ...func(*s3.Options)) (*s3.CopyObjectOutput, error)
	CreateMultipartUpload(ctx context.Context, params *s3.CreateMultipartUploadInput, optsFns ...func(*s3.Options)) (*s3.CreateMultipartUploadOutput, error)
	DeleteObject(ctx context.Context, params *s3.DeleteObjectInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectOutput, error)
	DeleteObjects(ctx context.Context, params *s3.DeleteObjectsInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectsOutput, error)
	GetObject(ctx context.Context, params *s3.GetObjectInput, optFns ...func(*s3.Options)) (*s3.GetObjectOutput, error)
	HeadObject(ctx context.Context, params *s3.HeadObjectInput, optFns ...func(*s3.Options)) (*s3.HeadObjectOutput, error)
	ListMultipartUploads(ctx context.Context, params *s3.ListMultipartUploadsInput, optFns ...func(*s3.Options)) (*s3.ListMultipartUploadsOutput, error)
	PutObject(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.Options)) (*s3.PutObjectOutput, error)
	UploadPart(ctx context.Context, params *s3.UploadPartInput, optFns ...func(*s3.Options)) (*s3.UploadPartOutput, error)
	UploadPartCopy(ctx context.Context, params *s3.UploadPartCopyInput, optFns ...func(*s3.Options)) (*s3.UploadPartCopyOutput, error)
}

type PresignAPI interface {
	PresignGetObject(ctx context.Context, params *s3.GetObjectInput, optFns ...func(*s3.PresignOptions)) (*v4.PresignedHTTPRequest, error)
	PresignPutObject(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.PresignOptions)) (*v4.PresignedHTTPRequest, error)
}

type S3Bucket struct {
	S3Client      S3API
	PresignClient PresignAPI
	BucketName    string
	Logger        *log.Logger
}

type BucketAPI interface {
	UploadObject(ctx context.Context, args UploadOjectArgs) (*manager.UploadOutput, error)
	UploadObjects(ctx context.Context, args []UploadOjectArgs) []s3.PutObjectOutput
	GetObject(ctx context.Context, key string) (*s3.GetObjectOutput, error)
	GetBulkObjects(ctx context.Context, keys []string) []s3.GetObjectOutput
	GetSignedGetURL(ctx context.Context, args GetSignedURLArgs) (*v4.PresignedHTTPRequest, error)
	GetSignedPutURL(ctx context.Context, args GetSignedURLArgs) (*v4.PresignedHTTPRequest, error)
	DeleteObject(ctx context.Context, key string) (*s3.DeleteObjectOutput, error)
	DeleteObjects(ctx context.Context, keys []string) (*s3.DeleteObjectsOutput, error)
	CopyObject(ctx context.Context, args CopyObjectArgs) (*s3.CopyObjectOutput, error)
	MoveObject(ctx context.Context, args MoveObjectArgs) (*MoveObjectResult, error)
}

type NewBucketArgs struct {
	BucketName string
	Config     *aws.Config
}

func NewBucket(args NewBucketArgs) *S3Bucket {
	bucketName, cfg := args.BucketName, args.Config

	if cfg == nil {
		newCfg, err := config.LoadDefaultConfig(context.TODO())
		if err != nil {
			panic("configuration error, " + err.Error())
		}
		cfg = &newCfg
	}

	s3Client := s3.NewFromConfig(*cfg)
	presignClient := s3.NewPresignClient(s3Client)
	logger := log.New(os.Stdout, fmt.Sprintf("s3-bucket(%s): ", bucketName), log.LstdFlags)

	return &S3Bucket{
		S3Client:      s3Client,
		PresignClient: presignClient,
		BucketName:    bucketName,
		Logger:        logger,
	}
}

func (bucket *S3Bucket) UploadObject(ctx context.Context, args UploadOjectArgs) (*manager.UploadOutput, error) {
	key, body := args.Key, args.Body
	uploader := manager.NewUploader(bucket.S3Client, func(u *manager.Uploader) {
		u.PartSize = 5 * 1024 * 1024
		u.Concurrency = 5
	})

	bucket.Logger.Printf("Starting multipart upload to s3://%s/%s\n", bucket.BucketName, key)
	result, err := uploader.Upload(ctx, &s3.PutObjectInput{
		Bucket: &bucket.BucketName,
		Key:    aws.String(key),
		Body:   body,
	})

	if err != nil {
		return nil, err
	}

	return result, nil
}

func (bucket *S3Bucket) UploadObjects(ctx context.Context, args []UploadOjectArgs) []s3.PutObjectOutput {
	putCommands := lo.Map(args, func(input UploadOjectArgs, _ int) s3.PutObjectInput {
		return s3.PutObjectInput{
			Bucket: &bucket.BucketName,
			Key:    aws.String(input.Key),
			Body:   input.Body,
		}
	})

	uploadResults := utils.FanOut(utils.FanOutArgs[s3.PutObjectInput, s3.PutObjectOutput]{
		Items:       putCommands,
		WorkerCount: len(args),
		WorkerCallback: func(workerId int, jobs <-chan s3.PutObjectInput, results chan<- utils.FanOutJobResult[s3.PutObjectOutput]) {
			for job := range jobs {
				bucket.Logger.Printf("Starting putObject to s3://%s/%s\n", bucket.BucketName, *job.Key)
				result, err := bucket.S3Client.PutObject(ctx, &job)
				results <- utils.FanOutJobResult[s3.PutObjectOutput]{
					JobResult: result,
					Err:       err,
				}
			}
		},
	})

	for _, err := range uploadResults.Errors {
		bucket.Logger.Printf("Error uploading object: %v\n", err.Err)
	}

	return uploadResults.Results
}

func (bucket *S3Bucket) GetObject(ctx context.Context, key string) (*s3.GetObjectOutput, error) {
	return bucket.S3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: &bucket.BucketName,
		Key:    &key,
	})
}

func (bucket *S3Bucket) GetBulkObjects(ctx context.Context, keys []string) []s3.GetObjectOutput {
	getCommands := lo.Map(keys, func(key string, _ int) s3.GetObjectInput {
		return s3.GetObjectInput{
			Bucket: &bucket.BucketName,
			Key:    aws.String(key),
		}
	})

	uploadResults := utils.FanOut(utils.FanOutArgs[s3.GetObjectInput, s3.GetObjectOutput]{
		Items:       getCommands,
		WorkerCount: len(keys),
		WorkerCallback: func(workerId int, jobs <-chan s3.GetObjectInput, results chan<- utils.FanOutJobResult[s3.GetObjectOutput]) {
			for job := range jobs {
				bucket.Logger.Printf("Starting getObject from s3://%s/%s\n", bucket.BucketName, *job.Key)
				result, err := bucket.S3Client.GetObject(ctx, &job)
				results <- utils.FanOutJobResult[s3.GetObjectOutput]{
					JobResult: result,
					Err:       err,
				}
			}
		},
	})

	for _, err := range uploadResults.Errors {
		bucket.Logger.Printf("Error fetching object: %v\n", err.Err)
	}

	return uploadResults.Results
}

func (bucket *S3Bucket) GetSignedGetURL(ctx context.Context, args GetSignedURLArgs) (*v4.PresignedHTTPRequest, error) {
	return bucket.PresignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket:              &bucket.BucketName,
		Key:                 &args.Key,
		ResponseContentType: args.ContentType,
	}, func(po *s3.PresignOptions) {
		if args.ExpiresIn != nil {
			po.Expires = *args.ExpiresIn
		}
	})
}

func (bucket *S3Bucket) GetSignedPutURL(ctx context.Context, args GetSignedURLArgs) (*v4.PresignedHTTPRequest, error) {
	return bucket.PresignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket: &bucket.BucketName,
		Key:    &args.Key,
	}, func(po *s3.PresignOptions) {
		if args.ExpiresIn != nil {
			po.Expires = *args.ExpiresIn
		}
	})
}

func (bucket *S3Bucket) DeleteObject(ctx context.Context, key string) (*s3.DeleteObjectOutput, error) {
	return bucket.S3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: &bucket.BucketName,
		Key:    &key,
	})
}

func (bucket *S3Bucket) DeleteObjects(ctx context.Context, keys []string) (*s3.DeleteObjectsOutput, error) {
	objects := lo.Map(keys, func(key string, _ int) types.ObjectIdentifier {
		return types.ObjectIdentifier{
			Key: aws.String(key),
		}
	})

	return bucket.S3Client.DeleteObjects(ctx, &s3.DeleteObjectsInput{
		Bucket: &bucket.BucketName,
		Delete: &types.Delete{
			Objects: objects,
		},
	})
}

func (bucket *S3Bucket) CopyObject(ctx context.Context, args CopyObjectArgs) (*s3.CopyObjectOutput, error) {
	srcKey, dstKey, dstBucket := args.SourceKey, args.DestinationKey, args.DestinationBucket
	if dstKey == nil {
		dstKey = &srcKey
	}

	return bucket.S3Client.CopyObject(ctx, &s3.CopyObjectInput{
		Bucket:     &dstBucket.BucketName,
		CopySource: aws.String(fmt.Sprintf("%s/%s", bucket.BucketName, srcKey)),
		Key:        dstKey,
	})
}

func (bucket *S3Bucket) MoveObject(ctx context.Context, args MoveObjectArgs) (*MoveObjectResult, error) {
	copyRes, err := bucket.CopyObject(ctx, CopyObjectArgs{
		DestinationBucket: args.DestinationBucket,
		SourceKey:         args.SourceKey,
		DestinationKey:    &args.SourceKey,
	})

	if err != nil {
		return nil, err
	}

	deleteRes, err := bucket.DeleteObject(ctx, args.SourceKey)

	if err != nil {
		return nil, err
	}

	return &MoveObjectResult{
		CopyResult:   copyRes,
		DeleteResult: deleteRes,
	}, nil
}
