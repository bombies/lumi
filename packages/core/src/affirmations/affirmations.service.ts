import { TRPCError } from '@trpc/server';

import { getRelationshipForUser } from '../relationships/relationship.service';
import {
	Affirmation,
	DatabaseAffirmation,
	DatabaseReceivedAffirmation,
	ReceivedAffirmation,
} from '../types/affirmations.types';
import { EntityType, KeyPrefix } from '../types/dynamo.types';
import { buildInfiniteData } from '../types/infinite-data.dto';
import { Relationship } from '../types/relationship.types';
import { dynamo, getDynamicUpdateStatements } from '../utils/dynamo/dynamo.service';
import { extractPartnerIdFromRelationship } from '../utils/global-utils';
import { getUUID } from '../utils/utils';
import { CreateAffirmationDto, GetReceivedAffirmationsDto, UpdateAffirmationDto } from './affirmations.dto';

export const createAffirmation = async (dto: CreateAffirmationDto) => {
	const affirmationId = getUUID();
	const affirmation: Affirmation = {
		id: affirmationId,
		...dto,
		selectedCount: 0,
	};

	const res = await dynamo.put({
		TableName: process.env.TABLE_NAME,
		Item: {
			pk: `${KeyPrefix.AFFIRMATION}${dto.relationshipId}`,
			sk: `${KeyPrefix.AFFIRMATION}${dto.ownerId}#${affirmationId}`,
			...affirmation,
			entityType: EntityType.AFFIRMATION,
		} satisfies DatabaseAffirmation,
	});

	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to create affirmation',
		});

	return affirmation;
};

export const getAffirmationById = async (ownerId: string, relationshipId: string, affirmationId: string) => {
	const res = await dynamo.get({
		TableName: process.env.TABLE_NAME,
		Key: {
			pk: `${KeyPrefix.AFFIRMATION}${relationshipId}`,
			sk: `${KeyPrefix.AFFIRMATION}${ownerId}#${affirmationId}`,
		},
	});
	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to get affirmation',
		});
	return res.Item as Affirmation;
};

export const selectAffirmation = async (userId: string) => {
	const affirmations = await getAffirmationsFromPartner(userId);
	if (!affirmations.length) return undefined;

	const weights = affirmations.map(affirmation => 1 / (affirmation.selectedCount + 1));
	const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
	const r = Math.random() * totalWeight;

	let cumulative = 0;
	for (let i = 0; i < affirmations.length; i++) {
		cumulative += weights[i];
		if (r <= cumulative) {
			const selectedAffirmation = affirmations[i];
			await updateAffirmation(
				selectedAffirmation.ownerId,
				selectedAffirmation.relationshipId,
				selectedAffirmation.id,
				{
					selectedCount: selectedAffirmation.selectedCount + 1,
				},
			);
			return selectedAffirmation;
		}
	}
};

export const getOwnedAffirmationsForUser = async (userId: string, rship?: Relationship) => {
	if (rship && userId !== rship.partner1 && userId !== rship.partner2)
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'You are not in this relationship!',
		});

	const relationship = rship ?? (await getRelationshipForUser(userId));
	if (!relationship)
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'You are not in a relationship!',
		});

	const res = await dynamo.query({
		TableName: process.env.TABLE_NAME,
		KeyConditionExpression: '#pk = :pk and begins_with(#sk, :sk)',
		ExpressionAttributeNames: {
			'#pk': 'pk',
			'#sk': 'sk',
		},
		ExpressionAttributeValues: {
			':pk': `${KeyPrefix.AFFIRMATION}${relationship.id}`,
			':sk': `${KeyPrefix.AFFIRMATION}${userId}`,
		},
	});

	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to get affirmations',
		});

	return res.Items as Affirmation[];
};

export const getAffirmationsFromPartner = async (userId: string) => {
	const relationship = await getRelationshipForUser(userId);
	if (!relationship)
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'You are not in a relationship!',
		});

	return getOwnedAffirmationsForUser(extractPartnerIdFromRelationship(userId, relationship), relationship);
};

export const updateAffirmation = async (
	ownerId: string,
	relationshipId: string,
	affirmationId: string,
	dto: UpdateAffirmationDto,
) => {
	const { updateStatements, expressionAttributeValues, expressionAttributeNames } =
		getDynamicUpdateStatements<Affirmation>(dto);

	const relationship = await getAffirmationById(ownerId, relationshipId, affirmationId);

	const res = await dynamo.update({
		TableName: process.env.TABLE_NAME,
		Key: {
			pk: `${KeyPrefix.AFFIRMATION}${relationshipId}`,
			sk: `${KeyPrefix.AFFIRMATION}${ownerId}#${affirmationId}`,
		},
		UpdateExpression: updateStatements,
		ExpressionAttributeValues: expressionAttributeValues,
		ExpressionAttributeNames: expressionAttributeNames,
		ReturnValues: 'ALL_NEW',
	});

	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to update affirmation',
		});

	return res.Attributes as Affirmation;
};

export const deleteAffirmation = async (ownerId: string, relationshipId: string, affirmationId: string) => {
	const affirmation = await getAffirmationById(ownerId, relationshipId, affirmationId);
	if (!affirmation)
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'Affirmation not found',
		});

	const relationship = await getAffirmationById(ownerId, relationshipId, affirmationId);

	const res = await dynamo.delete({
		TableName: process.env.TABLE_NAME,
		Key: {
			pk: `${KeyPrefix.AFFIRMATION}${relationshipId}`,
			sk: `${KeyPrefix.AFFIRMATION}${ownerId}#${affirmationId}`,
		},
	});

	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to delete affirmation',
		});

	return affirmation;
};

export const deleteAffirmationsForRelationship = async (relationshipId: string) => {
	// TODO: Fix this. Need to fetch each affirmation independently and batch delete them in chunks.
	const res = await dynamo.delete({
		TableName: process.env.TABLE_NAME,
		Key: {
			pk: `${KeyPrefix.AFFIRMATION}${relationshipId}`,
		},
	});
};

export const createReceivedAffirmation = async (receiver: string, relationshipId: string, affirmation: string) => {
	const timestamp = new Date().toISOString();
	const receivedAffirmation: ReceivedAffirmation = {
		affirmation,
		timestamp,
	};

	const res = await dynamo.put({
		TableName: process.env.TABLE_NAME,
		Item: {
			pk: `${KeyPrefix.RECEIVED_AFFIRMATION}${relationshipId}`,
			sk: `${KeyPrefix.RECEIVED_AFFIRMATION}${receiver}#${timestamp}`,
			...receivedAffirmation,
			entityType: EntityType.RECEIVED_AFFIRMATION,
		} satisfies DatabaseReceivedAffirmation,
	});

	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to create received affirmation',
		});

	return receivedAffirmation;
};

export const getReceivedAffirmations = async (
	userId: string,
	relationshipId: string,
	{ limit, cursor, order }: GetReceivedAffirmationsDto,
) => {
	const res = await dynamo.query({
		TableName: process.env.TABLE_NAME,
		KeyConditionExpression: '#pk = :pk and begins_with(#sk, :sk)',
		ExpressionAttributeNames: {
			'#pk': 'pk',
			'#sk': 'sk',
		},
		ExpressionAttributeValues: {
			':pk': `${KeyPrefix.RECEIVED_AFFIRMATION}${relationshipId}`,
			':sk': `${KeyPrefix.RECEIVED_AFFIRMATION}${userId}#`,
		},
		ScanIndexForward: order === 'asc',
		Limit: limit,
		ExclusiveStartKey: cursor,
	});

	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to get received affirmations',
		});

	return buildInfiniteData((res.Items ?? []) as ReceivedAffirmation[], res.LastEvaluatedKey);
};
