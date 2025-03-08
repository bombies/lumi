import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, QueryCommandInput } from '@aws-sdk/lib-dynamodb';

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

export function getDynamicSetStatements(attributes: Record<string, unknown>) {
	const setStatements: string[] = [];
	const removeStatements: string[] = [];
	let expressionAttributeValues: Record<string, unknown> | undefined = undefined;
	let expressionAttributeNames: Record<string, string> | undefined = undefined;

	for (let [key, value] of Object.entries(attributes)) {
		if (value !== undefined && value !== null) {
			setStatements.push(
				`${setStatements.length === 0 ? 'SET ' : ''}#${key} = :${key}`,
			);

			if (!expressionAttributeValues) expressionAttributeValues = {};
			if (!expressionAttributeNames) expressionAttributeNames = {};
			expressionAttributeValues[`:${key}`] = value;
			expressionAttributeNames[`#${key}`] = key;
		} else if (value === null) {
			removeStatements.push(
				`${removeStatements.length === 0 ? 'REMOVE ' : ''}#${key}`,
			);
			if (!expressionAttributeNames) expressionAttributeNames = {};
			expressionAttributeNames[`#${key}`] = key;
		}
	}

	return {
		updateStatements: [setStatements.join(', '), removeStatements.join(', ')].join(
			'\n',
		),
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
