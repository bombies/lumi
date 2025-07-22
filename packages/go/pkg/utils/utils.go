package utils

import (
	"maps"
	"regexp"

	"github.com/google/uuid"
)

func PredicateOrElse[T any](predicate func() bool, trueVal, falseVal T) T {
	if res := predicate(); res {
		return trueVal
	} else {
		return falseVal
	}
}

type Boolean bool

func (b Boolean) ToString(trueVal, falseVal string) string {
	if b {
		if trueVal == "" {
			return "true"
		} else {
			return trueVal
		}
	} else {
		if falseVal == "" {
			return "false"
		} else {
			return falseVal
		}
	}
}

func GetUUID() string {
	return uuid.NewString()
}

func ChunkArray[T any](array []T, chunkSize *int) [][]T {
	if chunkSize == nil || *chunkSize <= 0 {
		return [][]T{array}
	}

	var chunks [][]T
	for i := 0; i < len(array); i += *chunkSize {
		end := min(i+*chunkSize, len(array))
		chunks = append(chunks, array[i:end])
	}
	return chunks
}

func SubstituteVariables(str string, variables map[string]string) (string, error) {
	variableRegex, err := regexp.Compile(`\{(\w+)\}`)
	if err != nil {
		return "", err
	}

	return variableRegex.ReplaceAllStringFunc(str, func(match string) string {
		replaced, ok := variables[match[1:len(match)-1]]
		if !ok {
			return match
		}
		return replaced
	}), nil
}

func DeepMerge(target, source map[string]any) map[string]any {
	// Create a new map and copy the target's contents to avoid mutation.
	output := make(map[string]any)
	maps.Copy(output, target)

	// Iterate over the source map.
	for key, sourceValue := range source {
		// Check if the key exists in the target map.
		if targetValue, ok := output[key]; ok {
			// If the key exists, check the types of the values.
			sourceMap, sourceIsMap := sourceValue.(map[string]any)
			targetMap, targetIsMap := targetValue.(map[string]any)

			sourceSlice, sourceIsSlice := sourceValue.([]any)
			targetSlice, targetIsSlice := targetValue.([]any)

			if targetIsMap && sourceIsMap {
				// If both values are maps, recursively merge them.
				output[key] = DeepMerge(targetMap, sourceMap)
			} else if targetIsSlice && sourceIsSlice {
				// If both values are slices, append the source slice to the target slice.
				// A new slice is created to hold the merged result.
				mergedSlice := append([]any{}, targetSlice...)
				mergedSlice = append(mergedSlice, sourceSlice...)
				output[key] = mergedSlice
			} else {
				// Otherwise, the source value overwrites the target value.
				output[key] = sourceValue
			}
		} else {
			// If the key does not exist in the target, add it.
			output[key] = sourceValue
		}
	}

	return output
}
