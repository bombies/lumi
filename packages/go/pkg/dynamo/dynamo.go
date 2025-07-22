package dynamo

import (
	"context"
	"fmt"
	"lumi/pkg/utils"
	"maps"
	"regexp"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/samber/lo"
)

func PutItem[T DynamoRecord](table *DynamoTable, args PutItemArgs[T]) (*T, error) {
	mappedItem, err := StructToAttributeMap(args.Item)
	if err != nil {
		return nil, err
	}

	res, err := table.DynamoClient.PutItem(args.Ctx, &dynamodb.PutItemInput{
		TableName: &table.TableName,
		Item:      mappedItem,
	})

	if err != nil {
		return nil, err
	}

	return AttributeMapToStruct[T](res.Attributes)
}

func GetItem[T DynamoRecord](table *DynamoTable, args GetItemArgs) (*T, error) {
	res, err := table.DynamoClient.GetItem(args.Ctx, &dynamodb.GetItemInput{
		TableName: &table.TableName,
		Key: map[string]types.AttributeValue{
			"pk": &types.AttributeValueMemberS{
				Value: args.PK,
			},
			"sk": &types.AttributeValueMemberS{
				Value: args.SK,
			},
		},
		ProjectionExpression: lo.TernaryF(args.ProjectedAttributes != nil, func() *string {
			return lo.ToPtr(strings.Join(args.ProjectedAttributes, ","))
		}, func() *string { return nil }),
	})

	if err != nil {
		return nil, err
	}

	return AttributeMapToStruct[T](res.Item)
}

func BatchGetItems[T DynamoRecord](table *DynamoTable, args BatchGetItemArgs) []T {
	chunkedRequests := lo.Chunk(
		args.Keys,
		lo.TernaryF(args.ChunkSize != nil, func() int { return *args.ChunkSize }, func() int { return 50 }),
	)

	res := utils.FanOut(utils.FanOutArgs[[]DynamoPrimaryKey, T]{
		Items:       chunkedRequests,
		WorkerCount: len(chunkedRequests),
		WorkerCallback: func(_ int, jobs <-chan []DynamoPrimaryKey, results chan<- utils.FanOutJobResult[T]) {
			keys := <-jobs

			res, err := table.DynamoClient.BatchGetItem(args.Ctx, &dynamodb.BatchGetItemInput{
				RequestItems: map[string]types.KeysAndAttributes{
					table.TableName: {
						Keys: lo.Map(
							keys,
							func(keyPair DynamoPrimaryKey, _ int) map[string]types.AttributeValue {
								return map[string]types.AttributeValue{
									"pk": &types.AttributeValueMemberS{
										Value: keyPair.PK,
									},
									"sk": &types.AttributeValueMemberS{
										Value: keyPair.SK,
									},
								}
							},
						),
					},
				},
			})

			if err != nil {
				results <- utils.FanOutJobResult[T]{
					Err: err,
				}
				return
			}

			for _, item := range res.Responses[table.TableName] {
				structItem, err := AttributeMapToStruct[T](item)
				if err != nil {
					results <- utils.FanOutJobResult[T]{
						Err: err,
					}
					return
				}

				results <- utils.FanOutJobResult[T]{
					JobResult: structItem,
				}
			}
		},
	})

	if errors := res.Errors; len(errors) > 0 {
		fmt.Println("[ERROR] Some items could not be fetched. Details:")
		for _, error := range errors {
			fmt.Println("\t", error)
		}
	}

	return res.Results
}

func GetItems[T DynamoRecord](table *DynamoTable, args GetItemsParams[T]) (*GetItemsResult[T], error) {
	queryExpression := args.QueryExpression
	filterExpression := queryExpression.Filter
	mapper := args.Mapper
	order := args.Order
	isExhaustive := lo.TernaryF(args.Exhaustive != nil, func() bool { return *args.Exhaustive }, func() bool { return false })

	keyNamesRegExp, err := regexp.Compile(`#(\w+)`)
	if err != nil {
		return nil, err
	}

	keyNames := keyNamesRegExp.FindAllString(queryExpression.Expression, -1)
	filterKeyNames := make([]string, 0)
	projectionFields := GetProjectionFields(args.ProjectedAttributes)

	if filterExpression != nil {
		filterKeyNames = keyNamesRegExp.FindAllString(filterExpression.Expression, -1)
	}

	expressionAttributeNames := make(map[string]string)
	expressionAttributeValues := make(map[string]types.AttributeValue)

	for _, keyName := range append(keyNames, filterKeyNames...) {
		expressionAttributeNames[keyName] = strings.ReplaceAll(keyName, "#", "")
	}

	maps.Copy(expressionAttributeNames, projectionFields.ProjectionExpressionNames)
	maps.Copy(expressionAttributeValues, WrapAttributes(queryExpression.Variables))

	if filterExpression != nil {
		maps.Copy(expressionAttributeValues, WrapAttributes(filterExpression.Variables))
	}

	params := &dynamodb.QueryInput{
		TableName:                 &table.TableName,
		IndexName:                 (*string)(args.Index),
		KeyConditionExpression:    &queryExpression.Expression,
		FilterExpression:          lo.TernaryF(filterExpression != nil, func() *string { return &filterExpression.Expression }, func() *string { return nil }),
		ProjectionExpression:      lo.Ternary(len(projectionFields.ProjectionExpression) > 0, &projectionFields.ProjectionExpression, nil),
		ExpressionAttributeNames:  expressionAttributeNames,
		ExpressionAttributeValues: expressionAttributeValues,
		ExclusiveStartKey:         args.Cursor,
		Limit:                     args.Limit,
		ScanIndexForward:          lo.TernaryF(order != nil, func() *bool { return lo.ToPtr(*order == AscendingQueryOrder) }, func() *bool { return nil }),
	}

	if isExhaustive {
		data, err := QueryWithPaginationExhaustion(QueryWithPaginationExhaustionArgs[T]{
			Table:  table,
			Ctx:    args.Ctx,
			Params: params,
			Mapper: mapper,
		})

		if err != nil {
			return nil, err
		}

		return &GetItemsResult[T]{
			Data:       data,
			NextCursor: nil,
		}, nil
	} else {
		res, err := table.DynamoClient.Query(args.Ctx, params)

		if err != nil {
			return nil, err
		}

		results := UnwrapItems(res.Items, mapper)

		return &GetItemsResult[T]{
			Data:       results,
			NextCursor: res.LastEvaluatedKey,
		}, nil
	}
}

func UpdateItem[T DynamoRecord](table *DynamoTable, args UpdateItemArgs) (*T, error) {
	updateParams, err := GetUpdateParams(&table.TableName, args)

	if err != nil {
		return nil, err
	}

	res, err := table.DynamoClient.UpdateItem(args.Ctx, updateParams)

	if err != nil {
		return nil, err
	}

	parsedAttributes, err := AttributeMapToStruct[T](res.Attributes)

	if err != nil {
		return nil, err
	}

	return parsedAttributes, nil
}

func DeleteItem(table *DynamoTable, args DeleteItemArgs) (bool, error) {
	_, err := table.DynamoClient.DeleteItem(args.Ctx, &dynamodb.DeleteItemInput{
		TableName: &table.TableName,
		Key: map[string]types.AttributeValue{
			"pk": &types.AttributeValueMemberS{
				Value: args.PK,
			},
			"sk": &types.AttributeValueMemberS{
				Value: args.SK,
			},
		},
	})

	if err != nil {
		return false, err
	}

	return true, nil
}

func WriteTransaction(table *DynamoTable, ctx context.Context, args ...WriteTransactionArgs) (*dynamodb.TransactWriteItemsOutput, error) {
	return table.DynamoClient.TransactWriteItems(ctx, &dynamodb.TransactWriteItemsInput{
		TransactItems: lo.Reduce(
			args,
			func(acc []types.TransactWriteItem, arg WriteTransactionArgs, _ int) []types.TransactWriteItem {
				put, delete, update := arg.Put, arg.Delete, arg.Update

				if put != nil {
					mappedItem, err := StructToAttributeMap(put.Item)
					if err != nil {
						fmt.Printf("[ERROR] Could not convert struct to attribute map: %v\n", err)
					} else {
						acc = append(acc, types.TransactWriteItem{
							Put: &types.Put{
								TableName: &table.TableName,
								Item:      mappedItem,
							},
						})
					}
				}

				if delete != nil {
					acc = append(acc, types.TransactWriteItem{
						Delete: &types.Delete{
							TableName: &table.TableName,
							Key: map[string]types.AttributeValue{
								"pk": &types.AttributeValueMemberS{
									Value: delete.PK,
								},
								"sk": &types.AttributeValueMemberS{
									Value: delete.SK,
								},
							},
						},
					})
				}

				if update != nil {
					res, err := GetDynamicUpdateStatements(update.Update)
					if err != nil {
						fmt.Printf("[ERROR] Could not get dynamic update statements: %v\n", err)
					} else {
						acc = append(acc, types.TransactWriteItem{
							Update: &types.Update{
								TableName: &table.TableName,
								Key: map[string]types.AttributeValue{
									"pk": &types.AttributeValueMemberS{
										Value: update.PK,
									},
									"sk": &types.AttributeValueMemberS{
										Value: update.SK,
									},
								},
								UpdateExpression:          &res.UpdateStatements,
								ExpressionAttributeNames:  res.ExpressionAttributeNames,
								ExpressionAttributeValues: res.ExpressionAttributeValues,
							},
						})
					}
				}

				return acc
			}, []types.TransactWriteItem{}),
	})
}
