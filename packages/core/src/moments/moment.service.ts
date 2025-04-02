import { TRPCError } from '@trpc/server';
import mime from 'mime';
import { Resource } from 'sst';

import { EntityType, KeyPrefix } from '../types/dynamo.types';
import { InfiniteData, getInfiniteData } from '../types/infinite-data.dto';
import { DatabaseMoment, DatabaseMomentMessage, Moment, MomentMessage } from '../types/moment.types';
import { deleteManyItems, dynamo, getItems, updateItem } from '../utils/dynamo/dynamo.service';
import { ContentPaths, StorageClient } from '../utils/s3/s3.service';
import { getUUID } from '../utils/utils';
import { attachUrlsToMoment } from './moment.helpers';
import {
	CreateMomentDetailsDto,
	CreateMomentMessageDto,
	GetInfiniteMomentMessagesDto,
	GetInfiniteMomentsDto,
	GetMomentUploadUrlDto,
	SearchMomentsByTitleDto,
	UpdateMomentDetailsDto,
} from './moments.dto';

const cleanMomentTitle = (title: string) => {
	return title.replace(/\s{2,}/g, ' ');
};

const normalizeMomentTitle = (title: string) => {
	return (
		title
			// Convert to lowercase for case-insensitive matching
			.toLowerCase()
			// Replace all special characters, punctuation with spaces
			.replace(/[^\w\s]/g, ' ')
			// Replace multiple spaces with a single space
			.replace(/\s+/g, ' ')
			// Trim leading and trailing spaces
			.trim()
	);
};

export const createMomentDetails = async (userId: string, relationshipId: string, dto: CreateMomentDetailsDto) => {
	const id = getUUID();
	const timestamp = new Date().toISOString();
	const moment: Moment = {
		id,
		relationshipId,
		userId,
		...dto,
		title: cleanMomentTitle(dto.title),
		normalizedTitle: normalizeMomentTitle(dto.title),
		createdAt: timestamp,
	};

	const res = await dynamo.put({
		TableName: process.env.TABLE_NAME,
		Item: {
			pk: KeyPrefix.moments.pk(id),
			sk: KeyPrefix.moments.sk(id),
			gsi1pk: KeyPrefix.moments.gsi1pk(relationshipId),
			gsi1sk: KeyPrefix.moments.gsi1sk(timestamp),
			gsi2pk: KeyPrefix.moments.gsi2pk(userId),
			gsi2sk: KeyPrefix.moments.gsi2sk(timestamp),
			...moment,
			entityType: EntityType.MOMENT_DETAILS,
		} satisfies DatabaseMoment,
	});

	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to create moment details',
		});

	return attachUrlsToMoment(moment);
};

export async function getMomentDetailsById(
	id: string,
	args: {
		safeReturn: true;
	},
): Promise<Moment | null>;

export async function getMomentDetailsById(
	id: string,
	args?: {
		safeReturn?: false;
	},
): Promise<Moment>;

export async function getMomentDetailsById(
	id: string,
	args?: {
		safeReturn?: boolean;
	},
): Promise<Moment | null> {
	const res = await dynamo.get({
		TableName: process.env.TABLE_NAME,
		Key: {
			pk: `${KeyPrefix.MOMENT_DETAILS}${id}`,
			sk: `${KeyPrefix.MOMENT_DETAILS}${id}`,
		},
	});

	if (!res.Item)
		if (args?.safeReturn) return null;
		else
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Moment details not found',
			});

	return attachUrlsToMoment(res.Item as Moment);
}

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

	return getInfiniteData<Moment>(res, moment => attachUrlsToMoment(moment));
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

	return getInfiniteData<Moment>(res, moment => attachUrlsToMoment(moment));
};

export const searchMomentsByTitle = async (
	relationshipId: string,
	{ title, limit, cursor, order }: SearchMomentsByTitleDto,
) => {
	return getItems<Moment>({
		index: 'GSI1',
		queryExpression: {
			expression: '#gsi1pk = :gsi1pk',
			variables: {
				':gsi1pk': KeyPrefix.moments.gsi1pk(relationshipId),
			},
			filter: {
				expression: 'contains(#normalizedTitle, :normalizedTitle)',
				variables: {
					':normalizedTitle': normalizeMomentTitle(title),
				},
			},
		},
		limit,
		cursor,
		order,
		mapper: attachUrlsToMoment,
	});
};

export const updateMomentDetails = async (id: string, data: UpdateMomentDetailsDto): Promise<Moment> => {
	const updatedMoment = await updateItem<Moment>({
		pk: KeyPrefix.moments.pk(id),
		sk: KeyPrefix.moments.sk(id),
		update: {
			...data,
			...(data.title ? { normalizedTitle: normalizeMomentTitle(data.title) } : {}),
		},
	});

	return attachUrlsToMoment(updatedMoment);
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
	const timestamp = dto.timestamp ?? new Date().toISOString();
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
			gsi1pk: `${KeyPrefix.MOMENT_MESSAGE}${dto.momentId}`,
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
	let cursor: Record<string, any> | undefined;

	const momentDetails: Moment[] = [];
	do {
		const res = await getItems<Moment>({
			index: 'GSI1',
			queryExpression: {
				expression: '#pk = :pk',
				variables: {
					':pk': `${KeyPrefix.MOMENT_DETAILS}${relationshipId}`,
				},
			},
			cursor,
		});
		cursor = res.nextCursor;

		if (res.data) momentDetails.push(...res.data);
	} while (cursor);

	return deleteManyItems(
		momentDetails.map(moment => ({
			pk: `${KeyPrefix.MOMENT_DETAILS}${moment.id}`,
			sk: `${KeyPrefix.MOMENT_MESSAGE}${moment.id}`,
		})),
	);
};

export const getMomentUploadUrl = async (
	relationshipId: string,
	{ objectKey, fileExtension }: GetMomentUploadUrlDto,
) => {
	const storageBucket = new StorageClient(Resource.ContentBucket.name);
	return storageBucket.getSignedPutUrl(
		ContentPaths.relationshipMoments(relationshipId, objectKey + '.' + fileExtension),
		{
			expires: 60 * 60,
			contentType: fileExtension && (mime.getType(fileExtension) ?? undefined),
		},
	);
};
