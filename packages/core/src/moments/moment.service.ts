import { TRPCError } from '@trpc/server';
import mime from 'mime';
import { Resource } from 'sst';

import { EntityType, KeyPrefix } from '../types/dynamo.types';
import { InfiniteData, getInfiniteData } from '../types/infinite-data.dto';
import { DatabaseMoment, DatabaseMomentMessage, Moment, MomentMessage } from '../types/moment.types';
import {
	deleteItem,
	deleteManyItems,
	dynamo,
	getItem,
	getItems,
	putItem,
	updateItem,
} from '../utils/dynamo/dynamo.service';
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

	await putItem<Moment, DatabaseMoment>({
		pk: KeyPrefix.moment.pk(id),
		sk: KeyPrefix.moment.sk(id),
		gsi1pk: KeyPrefix.moment.gsi1pk(relationshipId),
		gsi1sk: KeyPrefix.moment.gsi1sk(timestamp),
		gsi2pk: KeyPrefix.moment.gsi2pk(userId),
		gsi2sk: KeyPrefix.moment.gsi2sk(timestamp),
		...moment,
		entityType: EntityType.MOMENT_DETAILS,
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
	const res = await getItem<Moment>(KeyPrefix.moment.pk(id), KeyPrefix.moment.sk(id));

	if (!res)
		if (args?.safeReturn) return null;
		else
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Moment details not found',
			});

	return attachUrlsToMoment(res);
}

export const getMomentsForRelationship = async (
	relationshipId: string,
	{ limit, cursor, order }: GetInfiniteMomentsDto,
) => {
	return getItems<Moment>({
		index: 'GSI1',
		queryExpression: {
			expression: '#gsi1pk = :gsi1pk',
			variables: {
				':gsi1pk': KeyPrefix.moment.gsi1pk(relationshipId),
			},
		},
		cursor,
		order,
		limit,
		mapper: attachUrlsToMoment,
	});
};

export const getMomentsForUser = async (userId: string, { limit, cursor, order }: GetInfiniteMomentsDto) => {
	return getItems<Moment>({
		index: 'GSI2',
		queryExpression: {
			expression: '#gsi2pk = :gsi2pk',
			variables: {
				':gsi2pk': KeyPrefix.moment.gsi2pk(userId),
			},
		},
		cursor,
		order,
		limit,
		mapper: attachUrlsToMoment,
	});
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
				':gsi1pk': KeyPrefix.moment.gsi1pk(relationshipId),
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
		pk: KeyPrefix.moment.pk(id),
		sk: KeyPrefix.moment.sk(id),
		update: {
			...data,
			...(data.title ? { normalizedTitle: normalizeMomentTitle(data.title) } : {}),
		},
	});

	return attachUrlsToMoment(updatedMoment);
};

export const deleteMomentDetails = async (id: string) => {
	return deleteItem(KeyPrefix.moment.pk(id), KeyPrefix.moment.sk(id));
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

	return putItem<MomentMessage, DatabaseMomentMessage>({
		pk: KeyPrefix.momentMessage.pk(id),
		sk: KeyPrefix.momentMessage.sk(id),
		gsi1pk: KeyPrefix.momentMessage.gsi1pk(dto.momentId),
		gsi1sk: KeyPrefix.momentMessage.gsi1sk(timestamp),
		...message,
		entityType: EntityType.MOMENT_MESSAGE,
	});
};

export const getMomentMessageById = async (id: string) => {
	return getItem<MomentMessage>(KeyPrefix.momentMessage.pk(id), KeyPrefix.momentMessage.sk(id));
};

export const getMessagesForMoment = async ({ momentId, limit, cursor, order }: GetInfiniteMomentMessagesDto) => {
	return getItems<MomentMessage>({
		index: 'GSI1',
		queryExpression: {
			expression: '#gsi1pk = :gsi1pk',
			variables: {
				':gsi1pk': KeyPrefix.momentMessage.gsi1pk(momentId),
			},
		},
		cursor,
		order,
		limit,
	});
};

export const deleteMomentMessage = async (id: string) => {
	return deleteItem(KeyPrefix.momentMessage.pk(id), KeyPrefix.momentMessage.sk(id));
};

export const deleteMomentDetailsForRelationship = async (relationshipId: string) => {
	const momentDetails = await getItems<Moment>({
		index: 'GSI1',
		queryExpression: {
			expression: '#gsi1pk = :gsi1pk',
			variables: {
				':gsi1pk': KeyPrefix.moment.gsi1pk(relationshipId),
			},
		},
		exhaustive: true,
	});

	return deleteManyItems(
		momentDetails.data.map(moment => ({
			pk: KeyPrefix.moment.pk(moment.id),
			sk: KeyPrefix.moment.sk(moment.id),
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
