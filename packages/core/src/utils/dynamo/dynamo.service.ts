import type { DynamoDBClientConfig, TransactWriteItemsInput, Update } from '@aws-sdk/client-dynamodb';
import type {
	BatchWriteCommandInput,
	QueryCommandInput,
	TransactWriteCommandInput,
	UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';
import type { Nullable, ValueType } from '../../types/util.types';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
	DynamoDBDocument,
} from '@aws-sdk/lib-dynamodb';

import { TRPCError } from '@trpc/server';
import { chunkArray } from '../utils';

const client = new DynamoDBClient({
	region: 'us-east-1',
});
console.log('test dynamo!', client.config.region);
export const dynamo = DynamoDBDocument.from(client, {
	marshallOptions: {
		convertEmptyValues: true,
		removeUndefinedValues: true,
		convertClassInstanceToMap: true,
	},
});

export const buildDynamo = (args?: DynamoDBClientConfig) =>
	DynamoDBDocument.from(
		new DynamoDBClient({
			...args,
		}),
		{
			marshallOptions: {
				convertEmptyValues: true,
				removeUndefinedValues: true,
				convertClassInstanceToMap: true,
			},
		},
	);

export function getDynamicUpdateStatements<T extends object = any>(attributes: Partial<Nullable<T>>) {
	const setStatements: string[] = [];
	const removeStatements: string[] = [];
	let expressionAttributeValues: Record<string, unknown> | undefined;
	let expressionAttributeNames: Record<string, string> | undefined;

	for (const [key, value] of Object.entries(attributes)) {
		if (value !== undefined && value !== null) {
			setStatements.push(`${setStatements.length === 0 ? 'SET ' : ''}#${key} = :${key}`);

			if (!expressionAttributeValues) expressionAttributeValues = {};
			if (!expressionAttributeNames) expressionAttributeNames = {};
			expressionAttributeValues[`:${key}`] = value;
			expressionAttributeNames[`#${key}`] = key;
		} else if (value === null) {
			removeStatements.push(`${removeStatements.length === 0 ? 'REMOVE ' : ''}#${key}`);
			if (!expressionAttributeNames) expressionAttributeNames = {};
			expressionAttributeNames[`#${key}`] = key;
		}
	}

	return {
		updateStatements: [setStatements.join(', '), removeStatements.join(', ')].join('\n'),
		expressionAttributeValues,
		expressionAttributeNames,
	};
}

export async function queryWithPaginationExhaustion<T>(params: QueryCommandInput) {
	const results: T[] = [];

	let res = await dynamo.query(params);
	if (res.Items) results.push(...(res.Items as T[]));

	while (res.LastEvaluatedKey) {
		res = await dynamo.query({
			...params,
			ExclusiveStartKey: res.LastEvaluatedKey,
		});
		if (res.Items) results.push(...(res.Items as T[]));
	}

	return results;
}

export function getProjectionFields<T>(fields: (keyof T)[]) {
	return {
		projectionExpression: getProjectExpression(fields),
		projectionExpressionNames: getProjectionExpressionNames(fields),
	};
}

export function getProjectExpression<T>(fields: (keyof T)[]) {
	if (!fields.length) return undefined;

	return fields.map(field => `#${String(field)}`).join(', ');
}

export function getProjectionExpressionNames<T>(fields: (keyof T)[]) {
	const expressionAttributeNames: Record<string, string> = {};
	fields.forEach((field) => {
		expressionAttributeNames[`#${String(field)}`] = field as string;
	});

	return expressionAttributeNames;
}

export async function putItem<T extends Record<string, any>, DbType extends T = T>(item: DbType) {
	const res = await dynamo.put({
		TableName: process.env.TABLE_NAME,
		Item: item,
	});

	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to store item',
		});

	return item as T;
}

type GetItemArgs<T> = {
	projectedAttributes?: (keyof T)[];
};

export async function getItem<T extends Record<string, any>>(pk: string, sk: string, args?: GetItemArgs<T>) {
	const res = await dynamo.get({
		TableName: process.env.TABLE_NAME,
		Key: { pk, sk },
		ProjectionExpression: args?.projectedAttributes?.join(','),
	});

	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to fetch item',
		});

	if (!res.Item) return null;
	return res.Item as T;
}

export async function batchGetItems<T extends Record<string, any>>(keys: { pk: string; sk: string }[]) {
	const responses = await Promise.all(
		chunkArray(keys, 50).map(keyChunk =>
			dynamo.batchGet({
				RequestItems: {
					[process.env.TABLE_NAME!]: {
						Keys: keyChunk.map(key => ({
							pk: key.pk,
							sk: key.sk,
						})),
					},
				},
			}),
		),
	);

	const results = responses.reduce((acc, res) => {
		if (res.$metadata.httpStatusCode !== 200) return acc;
		return [...acc, ...(res.Responses?.[process.env.TABLE_NAME!] ?? [])] as T[];
	}, [] as T[]);

	// Handle unprocessed keys for each batch
	const incompleteResponses = responses.filter(response => response.UnprocessedKeys);
	if (incompleteResponses.length)
		for (const response of incompleteResponses) {
			const unprocessedKeys = response.UnprocessedKeys;
			if (unprocessedKeys && Object.keys(unprocessedKeys).length > 0) {
				const unprocessedResponse = await dynamo.batchGet({
					RequestItems: unprocessedKeys,
				});
				results.push(...((unprocessedResponse.Responses?.[process.env.TABLE_NAME!] ?? []) as T[]));
			}
		}

	return results;
}

type GetItemsParams<T> = {
	table?: string;
	index?: 'GSI1' | 'GSI2' | 'GSI3' | 'GSI4';
	order?: 'asc' | 'desc';
	cursor?: Record<string, any> | null;
	limit?: number;
	projectedAttributes?: (keyof T)[];
	queryExpression: {
		/**
		 * This is the KeyConditionExpression. It is essential that any attribute names here start with `#`
		 * and matches the attribute name exactly.
		 * @example
			{
				...,
				expression: '#userId = :userId', // if the attribute name is "userId"
			}
		 */
		expression: string;
		variables: Record<string, any>;
		filter?: {
			expression: string;
			variables: Record<string, any>;
		};
	};
	/**
	 * This determines whether the function should keep fetching until the LastEvaluatedKey
	 * ends up being undefined.
	 */
	exhaustive?: boolean;
	mapper?: (item: T) => T | Promise<T>;
};

export async function getItems<T extends Record<string, any>>({
	table,
	index,
	order,
	cursor,
	limit,
	queryExpression,
	projectedAttributes,
	exhaustive,
	mapper,
}: GetItemsParams<T>) {
	const keyNames = queryExpression.expression.match(/#(\w+)/g)?.map(key => key.slice(1));
	const filterKeyNames = queryExpression.filter?.expression.match(/#(\w+)/g)?.map(key => key.slice(1));
	const { projectionExpression, projectionExpressionNames } = getProjectionFields(projectedAttributes ?? []);
	const params: QueryCommandInput = {
		TableName: table ?? process.env.TABLE_NAME,
		IndexName: index,
		KeyConditionExpression: queryExpression.expression,
		FilterExpression: queryExpression.filter?.expression,
		ProjectionExpression: projectionExpression,
		ExpressionAttributeNames: {
			...keyNames?.reduce((acc, key) => ({ ...acc, [`#${key}`]: key }), {}),
			...filterKeyNames?.reduce((acc, key) => ({ ...acc, [`#${key}`]: key }), {}),
			...projectionExpressionNames,
		},
		ExpressionAttributeValues: { ...queryExpression.variables, ...queryExpression.filter?.variables },
		ExclusiveStartKey: cursor ?? undefined,
		Limit: limit,
		ScanIndexForward: order === 'asc',
	};

	if (exhaustive) {
		let data = await queryWithPaginationExhaustion<T>(params);
		if (mapper) data = await Promise.all(data.map(mapper));
		return { data, nextCursor: undefined };
	} else {
		const res = await dynamo.query(params);

		if (res.$metadata.httpStatusCode !== 200)
			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
				message: 'Failed to fetch items',
			});

		let data = (res.Items ?? []) as T[];
		if (mapper) data = await Promise.all(data.map(mapper));
		return { data, nextCursor: res.LastEvaluatedKey };
	}
}

type UpdateItemParams<T> = {
	pk: string;
	sk: string;
	update: Partial<T>;
};

function getUpdateParams<T extends Record<string, any>>({ pk, sk, update }: UpdateItemParams<T>): UpdateCommandInput {
	const { updateStatements, expressionAttributeValues, expressionAttributeNames }
		= getDynamicUpdateStatements<T>(update);

	return {
		TableName: process.env.TABLE_NAME,
		Key: { pk, sk },
		UpdateExpression: updateStatements,
		ExpressionAttributeValues: expressionAttributeValues,
		ExpressionAttributeNames: expressionAttributeNames,
		ReturnValues: 'ALL_NEW',
	};
}

export async function updateItem<T extends Record<string, any>>({ pk, sk, update }: UpdateItemParams<T>) {
	const updateParams = getUpdateParams({ pk, sk, update });
	const res = await dynamo.update(updateParams);
	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to update item',
		});

	return res.Attributes as T;
}

export async function updateMany<T extends Record<string, any>>(items: UpdateItemParams<T>[]) {
	const requestParams = items.map<NonNullable<TransactWriteItemsInput['TransactItems']>[0]>((item) => {
		const params = getUpdateParams(item);
		return { Update: params as Update };
	});

	return Promise.all(
		// `TransactWriteItems` can group up to 100 action requests, but we're setting a soft limit of 75
		// to prevent any case where the aggregate size of the requests exceeds the 4MB limit.
		chunkArray(requestParams, 75).map(chunk =>
			dynamo.transactWrite({
				TransactItems: chunk,
			}),
		),
	);
}

export async function deleteItem(pk: string, sk: string) {
	const res = await dynamo.delete({
		TableName: process.env.TABLE_NAME,
		Key: { pk, sk },
	});

	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to delete item',
		});

	return true;
}

export async function deleteManyItems(items: { pk: string; sk: string }[]) {
	return Promise.all(
		chunkArray(items, 25).map(async (chunk) => {
			return await dynamo.batchWrite({
				RequestItems: {
					[process.env.TABLE_NAME!]: chunk.map(record => ({
						DeleteRequest: {
							Key: {
								pk: record.pk,
								sk: record.sk,
							},
						},
					})),
				},
			});
		}),
	);
}

type TransactionParams = { table?: string } & (
	| {
		put: {
			item: Record<string, any>;
		};
	}
	| {
		deleteItem: {
			pk: string;
			sk: string;
		};
	}
	| {
		update: {
			pk: string;
			sk: string;
			update: Partial<Record<string, any>>;
		};
	}
);

export async function writeTransaction(...params: TransactionParams[]) {
	const res = await dynamo.transactWrite({
		TransactItems: params.reduce(
			(acc, param) => {
				const tableName = param.table ?? process.env.TABLE_NAME;

				if ('put' in param) {
					acc.push({
						Put: {
							TableName: tableName,
							Item: param.put.item,
						},
					});
				} else if ('deleteItem' in param) {
					acc.push({
						Delete: {
							TableName: tableName,
							Key: {
								pk: param.deleteItem.pk,
								sk: param.deleteItem.sk,
							},
						},
					});
				} else if ('update' in param) {
					const { updateStatements, expressionAttributeValues, expressionAttributeNames }
						= getDynamicUpdateStatements(param.update.update);

					acc.push({
						Update: {
							TableName: tableName,
							Key: {
								pk: param.update.pk,
								sk: param.update.sk,
							},
							UpdateExpression: updateStatements,
							ExpressionAttributeValues: expressionAttributeValues,
							ExpressionAttributeNames: expressionAttributeNames,
						},
					});
				}

				return acc;
			},
			[] as NonNullable<TransactWriteCommandInput['TransactItems']>,
		),
	});

	if (res.$metadata.httpStatusCode !== 200) {
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to conduct write transaction!',
		});
	}

	return res;
}

type BatchWriteParams = {
	table?: string;
} & (
		{
			deleteItem: {
				pk: string;
				sk: string;
			};
		}
		| {
			put: {
				item: Record<string, any>;
			};
		}
	);

export async function batchWrite(...params: BatchWriteParams[]) {
	const groupedParams = Object.groupBy(params, param => param.table ?? process.env.TABLE_NAME!);
	const res = await dynamo.batchWrite({
		RequestItems: Object.entries(groupedParams).reduce(
			(acc, [table, params]) => {
				if (params)
					acc[table] = params.reduce(
						(acc, param) => {
							if ('deleteItem' in param) {
								acc.push({
									DeleteRequest: {
										Key: param.deleteItem,
									},
								});
							} else if ('put' in param) {
								acc.push({
									PutRequest: {
										Item: param.put.item,
									},
								});
							}
							return acc;
						},
						[] as NonNullable<ValueType<BatchWriteCommandInput['RequestItems']>>,
					);
				return acc;
			},
			{} as NonNullable<BatchWriteCommandInput['RequestItems']>,
		),
	});

	if (res.$metadata.httpStatusCode !== 200) {
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to conduct batch write!',
		});
	}

	return res;
}
