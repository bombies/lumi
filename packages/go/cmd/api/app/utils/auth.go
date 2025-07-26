package utils

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/lestrrat-go/httprc/v3"
	"github.com/lestrrat-go/jwx/v3/jwk"
	"github.com/lestrrat-go/jwx/v3/jwt"
)

type TokenClaims struct {
	Id            string `json:"id"`
	Email         string `json:"email"`
	EmailVerified bool   `json:"emailVerified"`
	Name          string `json:"name"`
	Image         string `json:"image,omitempty"`
}

var jwksCache *jwk.Cache

func SetupJWKSCache(ctx context.Context) error {
	jwksURL := os.Getenv("FRONTEND_URL") + "/api/auth/jwks"

	cache, err := jwk.NewCache(ctx, httprc.NewClient())
	if err != nil {
		return fmt.Errorf("failed to create cache: %w\n", err)
	}

	err = cache.Register(ctx, jwksURL, jwk.WithMinInterval(15*time.Minute))
	if err != nil {
		return fmt.Errorf("failed to register JWKS URL in cache: %w", err)
	}

	// Trigger an initial refresh to ensure keys are available immediately.
	_, err = cache.Refresh(ctx, jwksURL)
	if err != nil {
		return fmt.Errorf("failed to perform initial JWKS refresh: %w", err)
	}

	jwksCache = cache
	return nil
}

func GetBearerToken(c *gin.Context) (string, error) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return "", errors.New("authorization header is required")
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return "", errors.New("authorization header format must be Bearer {token}")
	}

	return parts[1], nil
}

func DecodeBearerToken(ctx context.Context, token string) (*TokenClaims, error) {
	expectedIssuer := os.Getenv("FRONTEND_URL")
	expectedAudience := os.Getenv("FRONTEND_URL")
	jwksURL := os.Getenv("FRONTEND_URL") + "/api/auth/jwks"
	keySet, err := jwksCache.Lookup(ctx, jwksURL)

	if err != nil {
		return nil, err
	}

	parsedToken, err := jwt.Parse(
		[]byte(token),
		jwt.WithKeySet(keySet),
		jwt.WithValidate(true),
		jwt.WithIssuer(expectedIssuer),
		jwt.WithAudience(expectedAudience),
	)

	if err != nil {
		if errors.Is(err, jwt.TokenExpiredError()) {
			return nil, fmt.Errorf("access token expired: %w", err)
		}
		if errors.Is(err, jwt.ParseError()) {
			return nil, fmt.Errorf("token validation failed on a claim: %w", err)
		}
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	var userId string
	if err := parsedToken.Get("id", &userId); err != nil {
		return nil, fmt.Errorf("failed to extract user ID from token: %w", err)
	}

	var email string
	if err := parsedToken.Get("id", &email); err != nil {
		return nil, fmt.Errorf("failed to extract email from token: %w", err)
	}

	var emailVerified bool
	if err := parsedToken.Get("id", &emailVerified); err != nil {
		return nil, fmt.Errorf("failed to extract emailVerified from token: %w", err)
	}

	var name string
	if err := parsedToken.Get("id", &name); err != nil {
		return nil, fmt.Errorf("failed to extract name from token: %w", err)
	}

	var image string
	if err := parsedToken.Get("id", &image); err != nil {
		return nil, fmt.Errorf("failed to extract image from token: %w", err)
	}

	return &TokenClaims{
		Id:            userId,
		Email:         email,
		EmailVerified: emailVerified,
		Name:          name,
		Image:         image,
	}, nil
}

func ProtectedRoute(router *gin.Engine, path string) *gin.RouterGroup {
	return router.Group(path, func(ctx *gin.Context) {
		tokenString, err := GetBearerToken(ctx)
		if err != nil {
			ctx.AbortWithStatusJSON(
				http.StatusUnauthorized,
				gin.H{"code": http.StatusUnauthorized, "message": err.Error()},
			)
			return
		}

		claims, err := DecodeBearerToken(ctx, tokenString)
		if err != nil {
			ctx.AbortWithStatusJSON(
				http.StatusUnauthorized,
				gin.H{"code": http.StatusUnauthorized, "message": err.Error()},
			)
			return
		}

		ctx.Set("user", *claims)
		ctx.Next()
	})
}
