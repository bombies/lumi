package s3

import (
	"context"
	"errors"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/feature/cloudfront/sign"
	"github.com/samber/lo"
)

type SignCdnUrlArgs struct {
	Url       string
	ExpiresIn *time.Duration
}

func SignCdnUrl(ctx context.Context, args SignCdnUrlArgs) (string, error) {
	keyPairId, privateKey := os.Getenv("KEY_PAIR_ID"), os.Getenv("CDN_PRIVATE_KEY")

	if keyPairId == "" {
		return "", errors.New("cloudfront key pair id is not set")
	}

	if privateKey == "" {
		return "", errors.New("cloudfront private key is not set")
	}

	privateKeyReader := strings.NewReader(privateKey)
	signedPrivateKey, err := sign.LoadPEMPrivKey(privateKeyReader)

	if err != nil {
		return "", err
	}

	signer := sign.NewURLSigner(keyPairId, signedPrivateKey)
	return signer.Sign(
		args.Url,
		lo.TernaryF(
			args.ExpiresIn != nil,
			func() time.Time {
				return time.Now().Add(*args.ExpiresIn)
			},
			func() time.Time {
				return time.Now().Add(1 * time.Hour)
			},
		),
	)
}
