package utils

import (
	"encoding/json"
	"fmt"
	"reflect"
)

func MapToStruct[T any](data map[string]any) (*T, error) {
	if data == nil {
		return nil, nil
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	var result T
	err = json.Unmarshal(jsonData, &result)
	if err != nil {
		return nil, err
	}

	return &result, nil
}

func StructToMap(item any) (map[string]any, error) {
	if reflect.ValueOf(item).Kind() != reflect.Struct {
		return nil, fmt.Errorf("item is not a struct")
	}

	jsonData, err := json.Marshal(item)
	if err != nil {
		return nil, err
	}

	var result map[string]any
	err = json.Unmarshal(jsonData, &result)
	if err != nil {
		return nil, err
	}

	return result, nil
}
