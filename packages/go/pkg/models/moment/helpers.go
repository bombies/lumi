package moment

import (
	"context"
	lumiRedis "lumi/pkg/redis"
	"lumi/pkg/s3"
	"regexp"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/samber/lo"
)

func cleanMomentTitle(title string) string {
	cleanRegex := regexp.MustCompile(`\s{2,}`)
	return cleanRegex.ReplaceAllString(title, " ")
}

func normalizeMomentTitle(title string) string {
	specialCharacterRegex := regexp.MustCompile(`[^\w\s]`)
	multiSpaceRefex := regexp.MustCompile(`\s+`)

	title = strings.ToLower(title)
	title = specialCharacterRegex.ReplaceAllString(title, " ")
	title = multiSpaceRefex.ReplaceAllString(title, " ")
	title = strings.Trim(title, " ")
	return title
}

func normalizeMomentTag(tag string) string {
	spaceRegex := regexp.MustCompile(`\s`)
	return spaceRegex.ReplaceAllString(normalizeMomentTitle(tag), "")
}

type AttachUrlsToMomentArgs struct {
	Moment      *MomentRecord
	RedisClient *redis.Client
}

func attachUrlsToMoment(ctx context.Context, args AttachUrlsToMomentArgs) error {
	moment, redisClient := args.Moment, args.RedisClient

	if moment == nil {
		return nil
	}

	unsignedVideoPath, err := s3.ContentPathsRelationshipMoments(
		moment.RelationshipId,
		moment.ObjectKey,
		s3.ReplaceVariablesOpts{
			WithHost: lo.ToPtr(true),
		},
	)

	if err != nil {
		return err
	}

	hashKeys := lumiRedis.HashKeys{}
	videoUrl, err := signMomentUrl(ctx, SignMomentUrlArgs{
		Key:         hashKeys.MomentSignedUrl(moment.Id),
		Url:         unsignedVideoPath,
		RedisClient: redisClient,
	})

	if err != nil {
		return err
	}

	moment.VideoURL = &videoUrl

	if moment.ThumbnailObjectKey != nil {
		unsignedThumbnailPath, err := s3.ContentPathsRelationshipMoments(
			moment.RelationshipId,
			*moment.ThumbnailObjectKey,
			s3.ReplaceVariablesOpts{
				WithHost: lo.ToPtr(true),
			},
		)

		if err != nil {
			return err
		}

		thumbnailUrl, err := signMomentUrl(ctx, SignMomentUrlArgs{
			Key:         hashKeys.MomentThumbnailSignedUrl(moment.Id),
			Url:         unsignedThumbnailPath,
			RedisClient: redisClient,
		})

		if err != nil {
			return err
		}

		moment.ThumbnailUrl = &thumbnailUrl
	}

	return nil
}

type SignMomentUrlArgs struct {
	Key         string
	Url         string
	RedisClient *redis.Client
}

func signMomentUrl(ctx context.Context, args SignMomentUrlArgs) (string, error) {
	key, url, redisClient := args.Key, args.Url, args.RedisClient

	if redisClient == nil {
		redisClient = lumiRedis.NewRedisClient()
	}

	cachedUrl, err := redisClient.Get(ctx, key).Result()
	if err == redis.Nil {
		signedUrl, err := s3.SignCdnUrl(ctx, s3.SignCdnUrlArgs{
			Url:       url,
			ExpiresIn: lo.ToPtr(30 * time.Minute),
		})

		if err != nil {
			return "", err
		}

		redisClient.Set(ctx, key, signedUrl, 29*time.Minute)

		return signedUrl, nil
	}

	return cachedUrl, nil
}
