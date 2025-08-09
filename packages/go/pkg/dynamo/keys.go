package dynamo

import "strings"

func BuildDynamoKey(prefix string, suffix ...string) string {
	keyArr := make([]string, 0, 1+len(suffix))
	keyArr = append(keyArr, prefix)
	keyArr = append(keyArr, suffix...)
	return strings.Join(keyArr, "#")
}
