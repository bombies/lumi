import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { TRPCError } from '@trpc/server';

import { Nullable } from '../../types/util.types';
import { chunkArray } from '../utils';

const client = new DynamoDBClient();
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
	let expressionAttributeValues: Record<string, unknown> | undefined = undefined;
	let expressionAttributeNames: Record<string, string> | undefined = undefined;

	for (let [key, value] of Object.entries(attributes)) {
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

export async function queryWithPagination<T>(params: QueryCommandInput) {
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

export function useProjection<T>(fields: (keyof T)[]) {
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
	fields.forEach(field => {
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

type GetItemsParams<T> = {
	index?: 'GSI1' | 'GSI2' | 'GSI3' | 'GSI4';
	order?: 'asc' | 'desc';
	cursor?: Record<string, any>;
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
};

export async function getItems<T extends Record<string, any>>({
	index,
	order,
	cursor,
	limit,
	queryExpression,
	projectedAttributes,
}: GetItemsParams<T>) {
	const keyNames = queryExpression.expression.match(/#(\w+)/g)?.map(key => key.slice(1));
	const filterKeyNames = queryExpression.filter?.expression.match(/#(\w+)/g)?.map(key => key.slice(1));
	const { projectionExpression, projectionExpressionNames } = useProjection(projectedAttributes ?? []);

	const res = await dynamo.query({
		TableName: process.env.TABLE_NAME,
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
		ExclusiveStartKey: cursor,
		Limit: limit,
		ScanIndexForward: order === 'asc',
	});

	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to fetch items',
		});

	return { data: res.Items as T[] | undefined, nextCursor: res.LastEvaluatedKey };
}

type UpdateItemParams<T> = {
	pk: string;
	sk?: string;
	update: Partial<T>;
};

export async function updateItem<T extends Record<string, any>>({ pk, sk, update }: UpdateItemParams<T>) {
	const { updateStatements, expressionAttributeValues, expressionAttributeNames } =
		getDynamicUpdateStatements<T>(update);

	const res = await dynamo.update({
		TableName: process.env.TABLE_NAME,
		Key: { pk, sk },
		UpdateExpression: updateStatements,
		ExpressionAttributeValues: expressionAttributeValues,
		ExpressionAttributeNames: expressionAttributeNames,
		ReturnValues: 'ALL_NEW',
	});

	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to update item',
		});

	return res.Attributes as T;
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
		chunkArray(items, 25).map(async chunk => {
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
