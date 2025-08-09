package s3

import (
	"fmt"
	"lumi/pkg/utils"
	"os"

	"github.com/samber/lo"
)

type ReplaceVariablesOpts struct {
	WithHost *bool
}

type replaceVariablesArgs struct {
	Path      string
	Variables map[string]string
}

func replaceVariables(args replaceVariablesArgs, opts ...ReplaceVariablesOpts) (string, error) {
	path, variables := args.Path, args.Variables

	var withHost *bool
	if len(opts) > 0 {
		withHost = opts[0].WithHost
	}

	if withHost == nil {
		withHost = lo.ToPtr(false)
	}

	val, err := utils.SubstituteVariables(path, variables)

	if err != nil {
		return "", err
	}

	return lo.TernaryF(*withHost,
		func() string {
			cdnUrl := os.Getenv("CDN_URL")
			return fmt.Sprintf("%s/%s", cdnUrl, val)
		},
		func() string {
			return val
		},
	), nil
}

func ContentPathsUserAvatar(userId, file string, opts ...ReplaceVariablesOpts) (string, error) {
	val, err := replaceVariables(replaceVariablesArgs{
		Path: "user/{userId}/avatar/",
		Variables: map[string]string{
			"userId": userId,
		},
	}, opts...)

	if err != nil {
		return "", err
	}

	return val + "/" + file, nil
}

func ContentPathsRelationshipMoments(relationshipId, file string, opts ...ReplaceVariablesOpts) (string, error) {
	val, err := replaceVariables(replaceVariablesArgs{
		Path: "private/relationships/{relationshipId}/moments",
		Variables: map[string]string{
			"relationshipId": relationshipId,
		},
	}, opts...)

	if err != nil {
		return "", err
	}

	return val + "/" + file, nil
}
