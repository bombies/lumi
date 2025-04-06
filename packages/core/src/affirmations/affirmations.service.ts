import { TRPCError } from '@trpc/server';
import { Resource } from 'sst';

import { sendNotification } from '../notifications/notifications.service';
import { getPartnerForUser, getRelationshipForUser } from '../relationships/relationship.service';
import {
	Affirmation,
	DatabaseAffirmation,
	DatabaseReceivedAffirmation,
	ReceivedAffirmation,
} from '../types/affirmations.types';
import { Relationship } from '../types/relationship.types';
import { User } from '../types/user.types';
import { WebSocketToken } from '../types/websockets.types';
import {
	bactchWrite,
	deleteItem,
	dynamo,
	getItem,
	getItems,
	putItem,
	updateItem,
} from '../utils/dynamo/dynamo.service';
import { DynamoKey, EntityType } from '../utils/dynamo/dynamo.types';
import { extractPartnerIdFromRelationship } from '../utils/global-utils';
import { chunkArray, getUUID } from '../utils/utils';
import { MqttClientType, createAsyncWebsocketConnection } from '../websockets/websockets.service';
import {
	CreateAffirmationDto,
	GetReceivedAffirmationsDto,
	SendCustomAffirmationDto,
	UpdateAffirmationDto,
} from './affirmations.dto';

export const createAffirmation = async (dto: CreateAffirmationDto) => {
	const affirmationId = getUUID();
	const affirmation: Affirmation = {
		id: affirmationId,
		...dto,
		selectedCount: 0,
	};

	return putItem<Affirmation, DatabaseAffirmation>({
		pk: DynamoKey.affirmation.pk(dto.relationshipId),
		sk: DynamoKey.affirmation.sk(dto.ownerId, affirmationId),
		...affirmation,
		entityType: EntityType.AFFIRMATION,
	});
};

export const getAffirmationById = async (ownerId: string, relationshipId: string, affirmationId: string) => {
	return getItem<Affirmation>(
		DynamoKey.affirmation.pk(relationshipId),
		DynamoKey.affirmation.sk(ownerId, affirmationId),
	);
};

export const selectAffirmation = async (userId: string) => {
	const affirmations = (await getAffirmationsFromPartner(userId)).data;
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

	return getItems<Affirmation>({
		queryExpression: {
			expression: '#pk = :pk and begins_with(#sk, :sk)',
			variables: {
				':pk': DynamoKey.affirmation.pk(relationship.id),
				':sk': DynamoKey.affirmation.buildKey(userId),
			},
		},
	});
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
	const affirmation = await getAffirmationById(ownerId, relationshipId, affirmationId);
	if (!affirmation)
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'Affirmation not found',
		});

	return updateItem<Affirmation>({
		pk: DynamoKey.affirmation.pk(relationshipId),
		sk: DynamoKey.affirmation.sk(ownerId, affirmationId),
		update: dto,
	});
};

export const deleteAffirmation = async (ownerId: string, relationshipId: string, affirmationId: string) => {
	const affirmation = await getAffirmationById(ownerId, relationshipId, affirmationId);
	if (!affirmation)
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'Affirmation not found',
		});

	await deleteItem(DynamoKey.affirmation.pk(relationshipId), DynamoKey.affirmation.sk(ownerId, affirmationId));
	return affirmation;
};

export const deleteAffirmationsForRelationship = async (relationshipId: string) => {
	const relationshipAffirmations = (
		await getItems<DatabaseAffirmation>({
			queryExpression: {
				expression: '#pk = :pk',
				variables: {
					':pk': DynamoKey.affirmation.pk(relationshipId),
				},
			},
			exhaustive: true,
		})
	).data;

	return Promise.all(
		chunkArray(relationshipAffirmations, 25).map(chunk =>
			bactchWrite(
				...chunk.map(chunkItem => ({
					deleteItem: {
						pk: chunkItem.pk,
						sk: chunkItem.sk,
					},
				})),
			),
		),
	);
};

export const createReceivedAffirmation = async (receiver: string, relationshipId: string, affirmation: string) => {
	const timestamp = new Date().toISOString();
	return putItem<ReceivedAffirmation, DatabaseReceivedAffirmation>({
		pk: DynamoKey.receivedAffirmation.pk(relationshipId),
		sk: DynamoKey.receivedAffirmation.sk(receiver, timestamp),
		affirmation,
		timestamp,
		entityType: EntityType.RECEIVED_AFFIRMATION,
	});
};

export const getReceivedAffirmations = async (
	userId: string,
	relationshipId: string,
	{ limit, cursor, order }: GetReceivedAffirmationsDto,
) => {
	return getItems<ReceivedAffirmation>({
		queryExpression: {
			expression: '#pk = :pk and begins_with(#sk, :sk)',
			variables: {
				':pk': DynamoKey.receivedAffirmation.pk(relationshipId),
				':sk': DynamoKey.receivedAffirmation.buildKey(userId),
			},
		},
		limit,
		cursor,
		order,
	});
};

export const getTodaysReceivedAffirmations = async (userId: string, relationshipId: string) => {
	const today = new Date().toISOString().split('T')[0];
	return getItems<ReceivedAffirmation>({
		queryExpression: {
			expression: '#pk = :pk and begins_with(#sk, :sk)',
			variables: {
				':pk': DynamoKey.receivedAffirmation.pk(relationshipId),
				':sk': DynamoKey.receivedAffirmation.buildKey(userId, today),
			},
		},
	});
};

export const sendAffirmationToUser = async (
	user: User,
	dto: SendCustomAffirmationDto & { mqttClient?: MqttClientType; partner?: User },
) => {
	const partner = dto.partner ?? (await getPartnerForUser(user.id));
	if (!partner || !user.relationshipId)
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'You are not in a relationship!',
		});

	const mqttConnection =
		dto.mqttClient ??
		(await createAsyncWebsocketConnection({
			endpoint: Resource.RealtimeServer.endpoint,
			authorizer: Resource.RealtimeServer.authorizer,
			token: WebSocketToken.GLOBAL,
		}));

	await sendNotification({
		user,
		payload: {
			title: `${partner.firstName} says`,
			body: dto.affirmation,
			openUrl: '/affirmations',
		},
		opts: {
			offlineWebSocketMessage: {
				mqttConnection,
				topic: `${process.env.NOTIFICATIONS_TOPIC}/${user.id}/notifications`,
			},
			async onSuccess() {
				await createReceivedAffirmation(user.id, user.relationshipId!, dto.affirmation);
			},
		},
	});
};
