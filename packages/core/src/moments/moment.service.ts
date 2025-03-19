import { QueryCommandInput, QueryCommandOutput } from '@aws-sdk/lib-dynamodb';
import { TRPCError } from '@trpc/server';

import { EntityType, KeyPrefix } from '../types/dynamo.types';
import { InfiniteData, getInfiniteData } from '../types/infinite-data.dto';
import { DatabaseMoment, DatabaseMomentMessage, Moment, MomentMessage } from '../types/moment.types';
import { dynamo, getDynamicUpdateStatements } from '../utils/dynamo/dynamo.service';
import { chunkArray, getUUID } from '../utils/utils';
import {
	CreateMomentDetailsDto,
	CreateMomentMessageDto,
	GetInfiniteMomentMessagesDto,
	GetInfiniteMomentsDto,
	UpdateMomentDetailsDto,
} from './moments.dto';

export const createMomentDetails = async (userId: string, relationshipId: string, dto: CreateMomentDetailsDto) => {
	const id = getUUID();
	const timestamp = new Date().toISOString();
	const moment: Moment = {
		id,
		relationshipId,
		userId,
		...dto,
		createdAt: timestamp,
	};

	const res = await dynamo.put({
		TableName: process.env.TABLE_NAME,
		Item: {
			pk: `${KeyPrefix.MOMENT_DETAILS}${id}`,
			sk: `${KeyPrefix.MOMENT_DETAILS}${id}`,
			gsi1pk: `${KeyPrefix.MOMENT_DETAILS}${relationshipId}`,
			gsi1sk: `${KeyPrefix.MOMENT_DETAILS}${timestamp}`,
			gsi2pk: `${KeyPrefix.MOMENT_DETAILS}${userId}`,
			gsi2sk: `${KeyPrefix.MOMENT_DETAILS}${timestamp}`,
			...moment,
			entityType: EntityType.MOMENT_DETAILS,
		} satisfies DatabaseMoment,
	});

	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to create moment details',
		});

	return moment;
};

export const getMomentDetailsById = async (id: string) => {
	const res = await dynamo.get({
		TableName: process.env.TABLE_NAME,
		Key: {
			pk: `${KeyPrefix.MOMENT_DETAILS}${id}`,
			sk: `${KeyPrefix.MOMENT_DETAILS}${id}`,
		},
	});

	if (!res.Item)
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'Moment details not found',
		});

	return res.Item as Moment;
};

export const getMomentsForRelationship = async (
	relationshipId: string,
	{ limit, cursor, order }: GetInfiniteMomentsDto,
): Promise<InfiniteData<Moment>> => {
	const res = await dynamo.query({
		TableName: process.env.TABLE_NAME,
		IndexName: 'GSI1',
		KeyConditionExpression: '#gsi1pk = :gsi1pk',
		ExpressionAttributeNames: {
			'#gsi1pk': 'gsi1pk',
		},
		ExpressionAttributeValues: {
			':gsi1pk': `${KeyPrefix.MOMENT_DETAILS}${relationshipId}`,
		},
		ScanIndexForward: order === 'asc',
		Limit: limit,
		ExclusiveStartKey: cursor,
	});

	return getInfiniteData<Moment>(res);
};

export const getMomentsForUser = async (
	userId: string,
	{ limit, cursor, order }: GetInfiniteMomentsDto,
): Promise<InfiniteData<Moment>> => {
	const res = await dynamo.query({
		TableName: process.env.TABLE_NAME,
		IndexName: 'GSI2',
		KeyConditionExpression: '#gsi2pk = :gsi2pk',
		ExpressionAttributeNames: {
			'#gsi2pk': 'gsi2pk',
		},
		ExpressionAttributeValues: {
			':gsi2pk': `${KeyPrefix.MOMENT_DETAILS}${userId}`,
		},
		ScanIndexForward: order === 'asc',
		Limit: limit,
		ExclusiveStartKey: cursor,
	});

	return getInfiniteData<Moment>(res);
};

export const updateMomentDetails = async (id: string, data: UpdateMomentDetailsDto): Promise<Moment> => {
	const { updateStatements, expressionAttributeNames, expressionAttributeValues } =
		getDynamicUpdateStatements<Moment>(data);
	const res = await dynamo.update({
		TableName: process.env.TABLE_NAME,
		Key: {
			pk: `${KeyPrefix.MOMENT_DETAILS}${id}`,
			sk: `${KeyPrefix.MOMENT_DETAILS}${id}`,
		},
		UpdateExpression: updateStatements,
		ExpressionAttributeNames: expressionAttributeNames,
		ExpressionAttributeValues: expressionAttributeValues,
		ReturnValues: 'ALL_NEW',
	});

	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to update moment details',
		});

	return res.Attributes as Moment;
};

export const deleteMomentDetails = async (id: string): Promise<void> => {
	const res = await dynamo.delete({
		TableName: process.env.TABLE_NAME,
		Key: {
			pk: `${KeyPrefix.MOMENT_DETAILS}${id}`,
			sk: `${KeyPrefix.MOMENT_DETAILS}${id}`,
		},
	});

	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to delete moment details',
		});
};

export const createMomentMessage = async (userId: string, dto: CreateMomentMessageDto) => {
	const id = getUUID();
	const timestamp = new Date().toISOString();
	const message: MomentMessage = {
		id,
		timestamp,
		senderId: userId,
		...dto,
	};

	const res = await dynamo.put({
		TableName: process.env.TABLE_NAME,
		Item: {
			pk: `${KeyPrefix.MOMENT_MESSAGE}${id}`,
			sk: `${KeyPrefix.MOMENT_MESSAGE}${id}`,
			gsi1pk: `${KeyPrefix.MOMENT_MESSAGE}${id}`,
			gsi1sk: `${KeyPrefix.MOMENT_MESSAGE}${timestamp}`,
			...message,
			entityType: EntityType.MOMENT_MESSAGE,
		} satisfies DatabaseMomentMessage,
	});

	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to send moment message',
		});

	return message;
};

export const getMomentMessageById = async (id: string) => {
	const res = await dynamo.get({
		TableName: process.env.TABLE_NAME,
		Key: {
			pk: `${KeyPrefix.MOMENT_MESSAGE}${id}`,
			sk: `${KeyPrefix.MOMENT_MESSAGE}${id}`,
		},
	});

	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to get moment message',
		});

	return res.Item as MomentMessage;
};

export const getMomentMessageByTimestamp = async (timestamp: string) => {
	const res = await dynamo.get({
		TableName: process.env.TABLE_NAME,
		Key: {
			pk: `${KeyPrefix.MOMENT_MESSAGE}${timestamp}`,
			sk: `${KeyPrefix.MOMENT_MESSAGE}${timestamp}`,
		},
	});

	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to get moment message',
		});

	return res.Item as DatabaseMomentMessage;
};

export const getMessagesForMoment = async ({ momentId, limit, cursor, order }: GetInfiniteMomentMessagesDto) => {
	const res = await dynamo.query({
		TableName: process.env.TABLE_NAME,
		IndexName: 'GSI1',
		KeyConditionExpression: '#pk = :pk',
		ExpressionAttributeNames: {
			'#pk': 'gsi1pk',
		},
		ExpressionAttributeValues: {
			':pk': `${KeyPrefix.MOMENT_MESSAGE}${momentId}`,
		},
		Limit: limit,
		ExclusiveStartKey: cursor ? { pk: cursor.pk, sk: cursor.sk } : undefined,
		ScanIndexForward: order === 'asc',
	});

	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to get moment messages',
		});

	return getInfiniteData<MomentMessage>(res);
};

export const deleteMomentMessage = async (id: string): Promise<void> => {
	const res = await dynamo.delete({
		TableName: process.env.TABLE_NAME,
		Key: {
			pk: `${KeyPrefix.MOMENT_MESSAGE}${id}`,
			sk: `${KeyPrefix.MOMENT_MESSAGE}${id}`,
		},
	});

	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to delete moment message',
		});
};

export const deleteMomentDetailsForRelationship = async (relationshipId: string) => {
	let res: QueryCommandOutput | undefined;

	const momentDetails: Moment[] = [];
	do {
		res = await dynamo.query({
			TableName: process.env.TABLE_NAME,
			IndexName: 'GSI1',
			KeyConditionExpression: '#pk = :pk',
			ExpressionAttributeNames: {
				'#pk': 'gsi1pk',
			},
			ExpressionAttributeValues: {
				':pk': `${KeyPrefix.MOMENT_DETAILS}${relationshipId}`,
			},
			ExclusiveStartKey: res?.LastEvaluatedKey,
		});

		if (res.Items) momentDetails.push(...res.Items.map(item => item as Moment));
	} while (res?.LastEvaluatedKey);

	chunkArray(momentDetails, 25).forEach(async chunk => {
		await dynamo.batchWrite({
			RequestItems: {
				[process.env.TABLE_NAME!]: chunk.map(record => ({
					DeleteRequest: {
						Key: {
							pk: `${KeyPrefix.MOMENT_DETAILS}${record.id}`,
							sk: `${KeyPrefix.MOMENT_MESSAGE}${record.id}`,
						},
					},
				})),
			},
		});
	});
};
