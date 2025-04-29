import type {
	DatabaseMoment,
	DatabaseMomentMessage,
	DatabaseMomentTag,
	DatabaseRelationshipMomentTag,
	Moment,
	MomentMessage,
	MomentTag,
	RelationshipMomentTag,
} from './moment.types';
import type {
	CreateMomentDetailsDto,
	CreateMomentMessageDto,
	CreateMomentTagDto,
	CreateRelationshipMomentTagDto,
	DeleteMomentTagDto,
	GetInfiniteMomentMessagesDto,
	GetInfiniteMomentsDto,
	GetMomentsByTagDto,
	GetMomentUploadUrlDto,
	GetRelationshipMomentTagsDto,
	SearchMomentsDto,
	UpdateMomentDetailsDto,
} from './moments.dto';
import { TRPCError } from '@trpc/server';

import mime from 'mime';
import { Resource } from 'sst';
import { buildInfiniteData } from '../types/infinite-data.dto';
import {
	batchGetItems,
	batchWrite,
	deleteItem,
	deleteManyItems,
	getItem,
	getItems,
	putItem,
	updateItem,
} from '../utils/dynamo/dynamo.service';
import { DynamoKey, EntityType } from '../utils/dynamo/dynamo.types';
import { ContentPaths, StorageClient } from '../utils/s3/s3.service';
import { chunkArray, getUUID } from '../utils/utils';
import { attachUrlsToMoment } from './moment.helpers';

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

const normalizeMomentTag = (tag: string) => {
	const normalizedTag = normalizeMomentTitle(tag);
	return normalizedTag.replaceAll(/\s/g, '');
};

export const createMomentDetails = async (
	userId: string,
	relationshipId: string,
	{ tags, ...dto }: CreateMomentDetailsDto,
) => {
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
		pk: DynamoKey.moment.pk(id),
		sk: DynamoKey.moment.sk(id),
		gsi1pk: DynamoKey.moment.gsi1pk(relationshipId),
		gsi1sk: DynamoKey.moment.gsi1sk(timestamp),
		gsi2pk: DynamoKey.moment.gsi2pk(userId),
		gsi2sk: DynamoKey.moment.gsi2sk(timestamp),
		...moment,
		entityType: EntityType.MOMENT_DETAILS,
	});

	if (tags?.length) {
		console.log(`Creating ${tags.length} tags...`);
		await Promise.all(tags.map(tag => createMomentTag(userId, relationshipId, { tag, momentId: id })));
	}

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
	const res = await getItem<Moment>(DynamoKey.moment.pk(id), DynamoKey.moment.sk(id));

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
				':gsi1pk': DynamoKey.moment.gsi1pk(relationshipId),
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
				':gsi2pk': DynamoKey.moment.gsi2pk(userId),
			},
		},
		cursor,
		order,
		limit,
		mapper: attachUrlsToMoment,
	});
};

export const searchMoments = async (relationshipId: string, { query, limit, cursor, order }: SearchMomentsDto) => {
	const moments = await getItems<Moment>({
		index: 'GSI1',
		queryExpression: {
			expression: '#gsi1pk = :gsi1pk',
			variables: {
				':gsi1pk': DynamoKey.moment.gsi1pk(relationshipId),
			},
			filter: {
				expression: 'contains(#normalizedTitle, :normalizedTitle)',
				variables: {
					':normalizedTitle': normalizeMomentTitle(query),
				},
			},
		},
		limit,
		cursor: cursor?.[0],
		order,
		mapper: attachUrlsToMoment,
	});

	const tagMoments = await getMomentsByTag(relationshipId, {
		tagQuery: query,
		limit,
		order,
		cursor: cursor?.[1],
	});

	// De-duplicate moments
	const momentMap = new Map<string, Moment>();
	moments.data.forEach((moment) => {
		if (!momentMap.has(moment.id)) {
			momentMap.set(moment.id, moment);
		}
	});

	tagMoments.data.forEach((moment) => {
		if (!momentMap.has(moment.id)) {
			momentMap.set(moment.id, moment);
		}
	});

	const data = (await Promise.all([...momentMap.values()].map(moment => attachUrlsToMoment(moment)))).sort((a, b) => {
		const createdAtA = new Date(a.createdAt).getTime();
		const createdAtB = new Date(b.createdAt).getTime();
		return order === 'asc' ? createdAtA - createdAtB : createdAtB - createdAtA;
	});

	return {
		data,
		nextCursor: [moments.nextCursor, tagMoments.cursor],
	};
};

export const updateMomentDetails = async (id: string, { tags, ...dto }: UpdateMomentDetailsDto): Promise<Moment> => {
	const updatedMoment = await updateItem<Moment>({
		pk: DynamoKey.moment.pk(id),
		sk: DynamoKey.moment.sk(id),
		update: {
			...dto,
			...(dto.title ? { normalizedTitle: normalizeMomentTitle(dto.title) } : {}),
		},
	});

	// Only create new tags if they are not already present
	tags = tags?.map(tag => normalizeMomentTag(tag));
	const existingTags = await getTagsForMoment(id);
	const existingTagNames = existingTags.map(tag => tag.tag);
	const newTags = tags?.filter(tag => !existingTagNames.includes(tag));
	const removedTags = tags?.length ? existingTags.filter(tag => !tags?.includes(tag.tag)) : [];

	if (newTags?.length) {
		const createdAt = new Date().toISOString();
		const relationshipId = updatedMoment.relationshipId;
		await Promise.all(
			chunkArray(newTags, 25).map(chunk =>
				batchWrite(
					...chunk.map(tag => ({
						put: {
							item: {
								pk: DynamoKey.momentTag.pk(id),
								sk: DynamoKey.momentTag.sk(tag),
								gsi1pk: DynamoKey.momentTag.gsi1pk(relationshipId),
								gsi1sk: DynamoKey.momentTag.gsi1sk(tag),
								entityType: EntityType.MOMENT_TAG,
								momentId: id,
								tag,
								taggerId: updatedMoment.userId,
								relationshipId,
								createdAt,
							} satisfies DatabaseMomentTag,
						},
					})),
				),
			),
		);
	}

	if (removedTags.length) {
		await deleteManyItems(
			removedTags.map(tag => ({
				pk: DynamoKey.momentTag.pk(id),
				sk: DynamoKey.momentTag.sk(tag.tag),
			})),
		);
	}

	return attachUrlsToMoment(updatedMoment);
};

export const deleteMomentDetails = async (id: string) => {
	return deleteItem(DynamoKey.moment.pk(id), DynamoKey.moment.sk(id));
};

export const createMomentMessage = async (userId: string, { id: messageId, ...dto }: CreateMomentMessageDto) => {
	const id = messageId ?? getUUID();
	const timestamp = dto.timestamp ?? new Date().toISOString();
	const message: MomentMessage = {
		id,
		timestamp,
		senderId: userId,
		...dto,
	};

	return putItem<MomentMessage, DatabaseMomentMessage>({
		pk: DynamoKey.momentMessage.pk(id),
		sk: DynamoKey.momentMessage.sk(id),
		gsi1pk: DynamoKey.momentMessage.gsi1pk(dto.momentId),
		gsi1sk: DynamoKey.momentMessage.gsi1sk(timestamp),
		...message,
		entityType: EntityType.MOMENT_MESSAGE,
	});
};

export const getMomentMessageById = async (id: string) => {
	return getItem<MomentMessage>(DynamoKey.momentMessage.pk(id), DynamoKey.momentMessage.sk(id));
};

export const getMessagesForMoment = async ({ momentId, limit, cursor, order }: GetInfiniteMomentMessagesDto) => {
	return getItems<MomentMessage>({
		index: 'GSI1',
		queryExpression: {
			expression: '#gsi1pk = :gsi1pk',
			variables: {
				':gsi1pk': DynamoKey.momentMessage.gsi1pk(momentId),
			},
		},
		cursor,
		order,
		limit,
	});
};

export const deleteMomentMessage = async (id: string) => {
	return deleteItem(DynamoKey.momentMessage.pk(id), DynamoKey.momentMessage.sk(id));
};

export const deleteMomentDetailsForRelationship = async (relationshipId: string) => {
	const momentDetails = await getItems<DatabaseMoment>({
		index: 'GSI1',
		queryExpression: {
			expression: '#gsi1pk = :gsi1pk',
			variables: {
				':gsi1pk': DynamoKey.moment.gsi1pk(relationshipId),
			},
		},
		exhaustive: true,
	});

	const relationshipMomentTags = await getItems<DatabaseRelationshipMomentTag>({
		queryExpression: {
			expression: '#pk = :pk',
			variables: {
				':pk': DynamoKey.relationshipMomentTag.pk(relationshipId),
			},
		},
		exhaustive: true,
	});

	if (relationshipMomentTags.data.length) {
		await deleteManyItems(
			relationshipMomentTags.data.map(tag => ({
				pk: tag.pk,
				sk: tag.sk,
			})),
		);
	}

	return deleteManyItems(
		momentDetails.data.map(moment => ({
			pk: moment.pk,
			sk: moment.sk,
		})),
	);
};

export const getRelationshipMomentTag = async (relationshipId: string, tag: string) => {
	return getItem<RelationshipMomentTag>(
		DynamoKey.relationshipMomentTag.pk(relationshipId),
		DynamoKey.relationshipMomentTag.sk(normalizeMomentTag(tag)),
	);
};

export const getRelationshipMomentTags = async (
	relationshipId: string,
	{ cursor, limit, query }: GetRelationshipMomentTagsDto,
) => {
	return getItems<RelationshipMomentTag>({
		queryExpression: {
			expression: `#pk = :pk${query ? ' and begins_with(#sk, :sk)' : ''}`,
			variables: {
				':pk': DynamoKey.relationshipMomentTag.pk(relationshipId),
				':sk': query ? DynamoKey.relationshipMomentTag.sk(normalizeMomentTag(query)) : undefined,
			},
		},
		cursor,
		limit,
		order: 'asc',
	});
};

export const getMomentTagsForRelationshipTag = async (relationshipId: string, tag: string) => {
	return getItems<DatabaseMomentTag>({
		index: 'GSI1',
		queryExpression: {
			expression: '#gsi1pk = :gsi1pk AND #gsi1sk = :gsi1sk',
			variables: {
				':gsi1pk': DynamoKey.momentTag.gsi1pk(relationshipId),
				':gsi1sk': normalizeMomentTag(tag),
			},
		},
		exhaustive: true,
	});
};

export const deleteRelationshipMomentTag = async (relationshipId: string, tag: string) => {
	return deleteItem(
		DynamoKey.relationshipMomentTag.pk(relationshipId),
		DynamoKey.relationshipMomentTag.sk(normalizeMomentTag(tag)),
	);
};

export const createRelationshipMomentTag = async (
	relationshipId: string,
	dto: CreateRelationshipMomentTagDto,
	opts?: {
		withInitialCount?: boolean;
	},
) => {
	const normalizedTag = normalizeMomentTag(dto.tag);
	const existingTag = await getRelationshipMomentTag(relationshipId, normalizedTag);
	if (existingTag)
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'There is already a tag with that name!',
		});

	return putItem<DatabaseRelationshipMomentTag>({
		pk: DynamoKey.relationshipMomentTag.pk(relationshipId),
		sk: DynamoKey.relationshipMomentTag.sk(normalizedTag),
		entityType: EntityType.RELATIONSHIP_MOMENT_TAG,
		tag: normalizedTag,
		associationCount: opts?.withInitialCount ? 1 : 0,
		relationshipId,
		createdAt: new Date().toISOString(),
	});
};

export const createMomentTag = async (userId: string, relationshipId: string, dto: CreateMomentTagDto) => {
	const normalizedTag = normalizeMomentTag(dto.tag);
	const createdAt = new Date().toISOString();
	return putItem<DatabaseMomentTag>({
		pk: DynamoKey.momentTag.pk(dto.momentId),
		sk: DynamoKey.momentTag.sk(normalizedTag),
		gsi1pk: DynamoKey.momentTag.gsi1pk(relationshipId),
		gsi1sk: DynamoKey.momentTag.gsi1sk(normalizedTag),
		entityType: EntityType.MOMENT_TAG,
		momentId: dto.momentId,
		tag: normalizedTag,
		taggerId: userId,
		relationshipId,
		createdAt,
	});
};

export const getMomentsByTag = async (relationshipId: string, dto: GetMomentsByTagDto) => {
	const tagResults = await getItems<MomentTag>({
		index: 'GSI1',
		queryExpression: {
			expression: '#gsi1pk = :gsi1pk AND begins_with(#gsi1sk, :gsi1sk)',
			variables: {
				':gsi1pk': DynamoKey.momentTag.gsi1pk(relationshipId),
				':gsi1sk': normalizeMomentTag(dto.tagQuery),
			},
		},
		cursor: dto.cursor,
		order: dto.order,
		limit: dto.limit,
	});

	const moments = (
		await batchGetItems<Moment>(
			tagResults.data.map(tag => ({
				pk: DynamoKey.moment.pk(tag.momentId),
				sk: DynamoKey.moment.sk(tag.momentId),
			})),
		)
	).map(moment => attachUrlsToMoment(moment));

	return buildInfiniteData(await Promise.all(moments), tagResults.nextCursor);
};

export const getTagsForMoment = async (momentId: string) => {
	return getItems<MomentTag>({
		queryExpression: {
			expression: '#pk = :pk',
			variables: {
				':pk': DynamoKey.momentTag.pk(momentId),
			},
		},
		exhaustive: true,
	}).then(res => res.data);
};

export const getTagForMoment = async (momentId: string, tag: string) => {
	return getItem<MomentTag>(DynamoKey.momentTag.pk(momentId), DynamoKey.momentTag.sk(normalizeMomentTag(tag)));
};

export const deleteMomentTag = async ({ momentId, tag }: DeleteMomentTagDto) => {
	return deleteItem(DynamoKey.momentTag.pk(momentId), DynamoKey.momentTag.sk(normalizeMomentTag(tag)));
};

export const getMomentUploadUrl = async (
	relationshipId: string,
	{ objectKey, fileExtension }: GetMomentUploadUrlDto,
) => {
	const storageBucket = new StorageClient(Resource.ContentBucket.name);
	return storageBucket.getSignedPutUrl(
		ContentPaths.relationshipMoments(relationshipId, `${objectKey}.${fileExtension}`),
		{
			expires: 60 * 60,
			contentType: fileExtension && (mime.getType(fileExtension) ?? undefined),
		},
	);
};
