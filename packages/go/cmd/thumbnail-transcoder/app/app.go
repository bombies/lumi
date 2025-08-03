package app

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"lumi/pkg/models/moment"
	"lumi/pkg/s3"
	"lumi/thumbnail-transcoder/globals"
	"os"
	"os/exec"
	"path"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

type App struct {
	Logger        *log.Logger
	MomentService *moment.MomentService
}

func NewApp() *App {
	logger := log.New(os.Stdout, "moment-thumbnail-transcoder: ", log.LstdFlags)

	return &App{
		Logger: logger,
		MomentService: moment.NewMomentService(moment.MomentServiceArgs{
			DynamoTable:   globals.DynamoTable,
			RedisClient:   globals.RedisClient,
			StorageBucket: globals.S3Bucket,
		}),
	}
}

func (app *App) Handler(ctx context.Context, event events.DynamoDBEvent) {
	for _, record := range event.Records {
		app.Logger.Printf("Received INSERT event for moment details record!")

		ffmpegPath := "/bin/ffmpeg"
		if _, err := os.Stat(ffmpegPath); err != nil && errors.Is(err, os.ErrNotExist) {
			app.Logger.Printf("Could not find an instance of ffmpeg at %s!", ffmpegPath)
			continue
		}

		if record.EventName == "" || record.Change.Keys == nil {
			continue
		}

		pk, sk := record.Change.Keys["PK"].String(), record.Change.Keys["SK"].String()

		if pk == "" || sk == "" {
			continue
		}

		newImage := record.Change.NewImage
		if newImage == nil {
			continue
		}

		app.Logger.Printf("Starting thumbnail transcoder for moment: %s\n", newImage["id"].String())

		rawObjectKey, relationshipId := newImage["objectKey"].String(), newImage["relationshipId"].String()
		objectKey, err := s3.ContentPathsRelationshipMoments(
			relationshipId,
			rawObjectKey,
		)

		if err != nil {
			app.Logger.Printf("Could not get content paths for moment: %s\n", err)
			continue
		}

		videoObject, err := globals.S3Bucket.GetObject(ctx, objectKey)
		if err != nil {
			app.Logger.Printf("Could not get video object from S3: %s\n", err)
			continue
		}

		app.Logger.Printf("Video object found: %s", objectKey)

		videoBody := videoObject.Body

		defer func() {
			if err := videoBody.Close(); err != nil {
				app.Logger.Printf("Could not close video body: %s", err)
			}
		}()

		videoData, err := io.ReadAll(videoBody)
		if err != nil {
			app.Logger.Printf("Could not read video body: %s", err)
			continue
		}

		videoPath := fmt.Sprintf("/tmp/%s", rawObjectKey)
		err = os.WriteFile(videoPath, videoData, os.FileMode(0644))
		if err != nil {
			app.Logger.Printf("Could not write video to file: %s", err)
			continue
		}

		app.Logger.Println("Saved video buffer to local file!")

		outputFile := fmt.Sprintf("%s.png", strings.Split(rawObjectKey, ".")[0])
		outputPath := path.Join("/tmp", outputFile)

		app.Logger.Println("Initializing ffmpeg params...")
		ffmpegParams := []string{"-i", videoPath, "-frames:v", "1", outputPath}

		app.Logger.Printf("Starting ffmpeg processing... ffmpeg path: %s\n", ffmpegPath)

		cmd := exec.CommandContext(ctx, ffmpegPath, ffmpegParams...)

		var stderr bytes.Buffer
		cmd.Stderr = &stderr

		app.Logger.Printf("Running command: %s %v", ffmpegPath, ffmpegParams)

		if err := cmd.Run(); err != nil {
			app.Logger.Printf("ffmpeg failed. Stderr: %s\n", stderr.String())
			continue
		}

		app.Logger.Println("Generated thumbnail")

		thumbnailData, err := os.ReadFile(outputPath)
		if err != nil {
			app.Logger.Printf("Could not read thumbnail data: %s", err)
			continue
		}

		outputKey, err := s3.ContentPathsRelationshipMoments(relationshipId, outputFile)
		if err != nil {
			app.Logger.Printf("Could not get content paths for moment: %s\n", err)
			continue
		}

		_, err = globals.S3Bucket.UploadObject(ctx, s3.UploadOjectArgs{
			Key:  outputKey,
			Body: bytes.NewReader(thumbnailData),
		})

		if err != nil {
			app.Logger.Printf("Could not upload thumbnail to S3: %s\n", err)
			continue
		}

		app.Logger.Println("Uploaded thumbnail to storage")

		_, err = app.MomentService.UpdateMomentDetails(
			ctx,
			newImage["id"].String(),
			moment.UpdateMomentDetailsDto{
				ThumbnailObjectKey: &outputFile,
			},
		)

		if err != nil {
			app.Logger.Printf("Could not update moment details: %s\n", err)
			continue
		}

		app.Logger.Println("Updated moment details")
	}
}
