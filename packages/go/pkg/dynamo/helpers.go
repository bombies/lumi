package dynamo

import (
	"fmt"
	"lumi/pkg/utils"
	"strconv"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/samber/lo"
)

func GetProjectionFields(fields []string) ProjectionFields {
	return ProjectionFields{
		ProjectionExpression:      GetProjectionExpression(fields),
		ProjectionExpressionNames: GetProjectionExpressionNames(fields),
	}
}

func GetProjectionExpression(fields []string) string {
	if len(fields) == 0 {
		return ""
	}

	return strings.Join(
		lo.Map(fields, func(field string, _ int) string {
			return fmt.Sprintf("#%s", field)
		}),
		", ",
	)
}

func GetProjectionExpressionNames(fields []string) map[string]string {
	expressionAttributeNames := make(map[string]string)

	for _, field := range fields {
		expressionAttributeNames[fmt.Sprintf("#%s", field)] = field
	}

	return expressionAttributeNames
}

func QueryWithPaginationExhaustion[T any](args QueryWithPaginationExhaustionArgs[T]) ([]T, error) {
	table, ctx, params, mapper := args.Table, args.Ctx, args.Params, args.Mapper
	results := make([]T, 0)

	for {
		res, err := table.DynamoClient.Query(ctx, params)
		if err != nil {
			return nil, err
		}

		unwrappedItems := UnwrapItems(res.Items, mapper)
		results = append(results, unwrappedItems...)

		if lastKey := res.LastEvaluatedKey; len(lastKey) == 0 {
			break
		}
	}

	return results, nil
}

func GetUpdateParams(tableName *string, args UpdateItemArgs) (*dynamodb.UpdateItemInput, error) {
	updateStatementArgs, err := GetDynamicUpdateStatements(args.UpdateBody)

	if err != nil {
		return nil, err
	}

	updateStatements, expressionNames, expressionValues := updateStatementArgs.UpdateStatements, updateStatementArgs.ExpressionAttributeNames, updateStatementArgs.ExpressionAttributeValues

	return &dynamodb.UpdateItemInput{
		TableName: tableName,
		Key: map[string]types.AttributeValue{
			"pk": &types.AttributeValueMemberS{Value: args.PK},
			"sk": &types.AttributeValueMemberS{Value: args.SK},
		},
		UpdateExpression:          &updateStatements,
		ExpressionAttributeNames:  expressionNames,
		ExpressionAttributeValues: expressionValues,
		ReturnValues:              types.ReturnValueAllNew,
	}, nil
}

func GetDynamicUpdateStatements(obj UpdateableDynamoRecord) (*GetDynamicUpdateStatementsResult, error) {
	setStatements, removeStatements := make([]string, 0), make([]string, 0)
	expressionAttributeNames, expressionAttributeValues := make(map[string]string), make(map[string]any)
	mappedObj, err := utils.StructToMap(obj)
	if err != nil {
		return nil, err
	}

	for key, value := range mappedObj {
		if fieldMap, ok := value.(map[string]any); ok {
			if _, isRemove := fieldMap["remove"]; isRemove {
				removeStatements = append(removeStatements, fmt.Sprintf("#%s", key))
				expressionAttributeNames["#"+key] = key
			} else if val, isSet := fieldMap["value"]; isSet {
				setStatements = append(setStatements, fmt.Sprintf("#%s = :%s", key, key))
				expressionAttributeNames["#"+key] = key
				expressionAttributeValues[":"+key] = val
			}
		} else if value != nil {
			setStatements = append(setStatements, fmt.Sprintf("#%s = :%s", key, key))
			expressionAttributeNames["#"+key] = key
			expressionAttributeValues[":"+key] = value
		}
	}

	updateStatements := make([]string, 0)

	if len(setStatements) > 0 {
		updateStatements = append(updateStatements, "SET "+strings.Join(setStatements, ", "))
	}

	if len(removeStatements) > 0 {
		updateStatements = append(updateStatements, "REMOVE "+strings.Join(removeStatements, ", "))
	}

	return &GetDynamicUpdateStatementsResult{
		UpdateStatements:          strings.Join(updateStatements, "\n"),
		ExpressionAttributeNames:  expressionAttributeNames,
		ExpressionAttributeValues: WrapAttributes(expressionAttributeValues),
	}, nil
}

func UnwrapItems[T any](items []map[string]types.AttributeValue, mapper func(T) T) []T {
	unwrappedItems := lo.Map(
		items,
		func(item map[string]types.AttributeValue, _ int) map[string]any {
			return UnwrapAttributes(item)
		},
	)

	data := utils.FanOut(utils.FanOutArgs[map[string]any, T]{
		Items:       unwrappedItems,
		WorkerCount: 5,
		WorkerCallback: func(workerId int, jobs <-chan map[string]any, results chan<- utils.FanOutJobResult[T]) {
			for data := range jobs {
				obj, err := utils.MapToStruct[T](data)
				if err != nil {
					results <- utils.FanOutJobResult[T]{
						Err: fmt.Errorf("[worker %v] error converting unwrapped attribute values to struct: %w", workerId, err),
					}
					continue
				}

				if mapper != nil {
					obj = lo.ToPtr(mapper(*obj))
				}

				results <- utils.FanOutJobResult[T]{
					JobResult: obj,
				}
			}
		},
	})

	if errors := data.Errors; len(errors) > 0 {
		fmt.Println("[ERROR] Some values could not be unwrapped. Details:")
		for _, error := range errors {
			fmt.Println("\t", error)
		}
	}

	return data.Results
}

func UnwrapAttributeValue(attr types.AttributeValue) any {
	switch v := attr.(type) {
	case *types.AttributeValueMemberS:
		return v.Value
	case *types.AttributeValueMemberN:
		num, err := strconv.ParseFloat(v.Value, 64)
		if err != nil {
			return v.Value
		}
		return num
	case *types.AttributeValueMemberBOOL:
		return v.Value
	case *types.AttributeValueMemberNULL:
		return nil
	case *types.AttributeValueMemberB:
		return v.Value // []byte
	case *types.AttributeValueMemberSS:
		return v.Value // []string
	case *types.AttributeValueMemberNS:
		// Number Sets are also strings that need parsing.
		nums := make([]float64, len(v.Value))
		for i, strNum := range v.Value {
			num, err := strconv.ParseFloat(strNum, 64)
			if err == nil {
				nums[i] = num
			}
		}
		return nums
	case *types.AttributeValueMemberL:
		// Recursively unwrap each element in the list.
		list := make([]any, len(v.Value))
		for i, item := range v.Value {
			list[i] = UnwrapAttributeValue(item)
		}
		return list
	case *types.AttributeValueMemberM:
		// Recursively unwrap the entire map.
		return UnwrapAttributes(v.Value)
	default:
		return nil
	}
}

func UnwrapAttributes(attrs map[string]types.AttributeValue) map[string]any {
	unwrapped := make(map[string]any, len(attrs))
	for key, value := range attrs {
		unwrapped[key] = UnwrapAttributeValue(value)
	}
	return unwrapped
}

func WrapAttributeValue(value any) types.AttributeValue {
	switch v := value.(type) {
	case string:
		return &types.AttributeValueMemberS{Value: v}
	case int, int8, int16, int32, int64, uint, uint8, uint16, uint32, uint64, float32, float64:
		return &types.AttributeValueMemberN{Value: fmt.Sprintf("%v", v)}
	case bool:
		return &types.AttributeValueMemberBOOL{Value: v}
	case []byte:
		return &types.AttributeValueMemberB{Value: v}
	case []string:
		return &types.AttributeValueMemberSS{Value: v}
	case []any:
		list := make([]types.AttributeValue, len(v))
		for i, item := range v {
			list[i] = WrapAttributeValue(item)
		}
		return &types.AttributeValueMemberL{Value: list}
	case map[string]any:
		return &types.AttributeValueMemberM{Value: WrapAttributes(v)}
	case nil:
		return &types.AttributeValueMemberNULL{Value: true}
	default:
		return &types.AttributeValueMemberS{Value: fmt.Sprintf("%v", v)}
	}
}

func WrapAttributes[V any](attrs map[string]V) map[string]types.AttributeValue {
	wrapped := make(map[string]types.AttributeValue, len(attrs))
	for key, value := range attrs {
		wrapped[key] = WrapAttributeValue(value)
	}
	return wrapped
}

func StructToAttributeMap[T any](item T) (map[string]types.AttributeValue, error) {
	data, err := utils.StructToMap(item)
	if err != nil {
		return nil, err
	}
	return WrapAttributes(data), nil
}

func AttributeMapToStruct[T any](wrappedMap map[string]types.AttributeValue) (*T, error) {
	unwrappedMap := UnwrapAttributes(wrappedMap)
	return utils.MapToStruct[T](unwrappedMap)
}
