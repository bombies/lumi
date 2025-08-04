package redis

import (
	"fmt"
	"lumi/pkg/utils"
	"os"

	"github.com/redis/go-redis/v9"
	"github.com/sst/sst/v3/sdk/golang/resource"
)

func NewRedisClient() *redis.Client {
	redisUser, err := resource.Get("RedisUser", "value")
	if err != nil {
		panic(fmt.Errorf("failed to get RedisUser: %w", err))
	}

	redisPassword, err := resource.Get("RedisPassword", "value")
	if err != nil {
		panic(fmt.Errorf("failed to get RedisPassword: %w", err))
	}

	redisHost, err := resource.Get("RedisHost", "value")
	if err != nil {
		panic(fmt.Errorf("failed to get RedisHost: %w", err))
	}

	redisPort, err := resource.Get("RedisPort", "value")
	if err != nil {
		panic(fmt.Errorf("failed to get RedisPort: %w", err))
	}

	opt, err := redis.ParseURL(fmt.Sprintf("rediss://%s:%s@%s:%s", redisUser.(string), redisPassword.(string), redisHost.(string), redisPort.(string)))
	if err != nil {
		panic(fmt.Errorf("failed to parse Redis URL: %w", err))
	}

	return redis.NewClient(opt)
}

func Key(suffix string) string {
	stage := os.Getenv("APP_STAGE")
	return fmt.Sprintf("lumi::%s::%s", stage, suffix)
}

type HashKeys struct{}

func (hk HashKeys) MomentSignedUrl(momentId string) string {
	suffix, err := utils.SubstituteVariables("moment_signed_url::{momentId}", map[string]string{"momentId": momentId})

	if err != nil {
		fmt.Println(fmt.Errorf("There was an error trying to substitute variables: %w", err))
	}

	return Key(suffix)
}

func (hk HashKeys) MomentThumbnailSignedUrl(momentId string) string {
	suffix, err := utils.SubstituteVariables("moment_thumbnail_signed_url::{momentId}", map[string]string{"momentId": momentId})

	if err != nil {
		fmt.Println(fmt.Errorf("There was an error trying to substitute variables: %w", err))
	}

	return Key(suffix)
}
