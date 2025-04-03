import { TRPCError } from '@trpc/server';

import { EntityType, KeyPrefix } from '../types/dynamo.types';
import { buildInfiniteData } from '../types/infinite-data.dto';
import {
	DatabaseRelationship,
	DatabaseRelationshipRequest,
	Relationship,
	RelationshipRequest,
} from '../types/relationship.types';
import { User } from '../types/user.types';
import { Nullable } from '../types/util.types';
import { getUserById } from '../users/users.service';
import { deleteItem, dynamo, getItem, getItems, putItem, writeTransaction } from '../utils/dynamo/dynamo.service';
import { chunkArray, getUUID } from '../utils/utils';
import { GetRelationshipRequestsForUserDto } from './relationship.dto';

export const getRelationshipById = async (relationshipId: string) => {
	return getItem<Relationship>(KeyPrefix.relationship.pk(relationshipId), KeyPrefix.relationship.sk(relationshipId));
};

export const userInRelationship = async (userId: string) => {
	const user = await getUserById(userId);
	if (!user)
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'User not found',
		});

	return !!user.relationshipId;
};

export const getRelationshipForUser = async (userId: string) => {
	const user = await getUserById(userId);
	if (!user)
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'User not found',
		});

	if (!user.relationshipId) return undefined;

	return getRelationshipById(user.relationshipId);
};

export const getPartnerForUser = async (userId: string) => {
	const relationship = await getRelationshipForUser(userId);
	if (!relationship) return undefined;

	return getUserById(relationship.partner1 === userId ? relationship.partner2 : relationship.partner1);
};

export const getRelationshipRequestBySenderAndReceiver = async (senderId: string, receiverId: string) => {
	return getItems<RelationshipRequest>({
		index: 'GSI1',
		queryExpression: {
			expression: `#gsi1pk = :gsi1pk and #gsi1sk = :gsi1sk`,
			variables: {
				':gsi1pk': KeyPrefix.relationshipRequest.gsi1pk(),
				':gsi1sk': KeyPrefix.relationshipRequest.gsi1sk(senderId),
			},
			filter: {
				expression: `#gsi2pk = :gsi2pk and #gsi2sk = :gsi2sk`,
				variables: {
					':gsi2pk': KeyPrefix.relationshipRequest.gsi2pk(),
					':gsi2sk': KeyPrefix.relationshipRequest.gsi2sk(receiverId),
				},
			},
		},
	}).then(res => res.data[0]);
};

export const userHasRequestFromUser = async (userId: string, senderId: string) => {
	return !!(await getRelationshipRequestBySenderAndReceiver(senderId, userId));
};

export const sendRelationshipRequest = async (senderId: string, receiverId: string) => {
	if (senderId === receiverId)
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'You cannot send a relationship request to yourself!',
		});

	if (await userInRelationship(senderId))
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'You are already in a relationship!',
		});

	if (await userInRelationship(receiverId))
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'User is already in a relationship!',
		});

	if (await userHasRequestFromUser(receiverId, receiverId))
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'You already have already sent this user a request!',
		});

	const requestFromReceiver = await getRelationshipRequestBySenderAndReceiver(receiverId, senderId);
	if (requestFromReceiver) return await acceptRelationshipRequest(receiverId, requestFromReceiver.id);

	const id = getUUID();
	const request: RelationshipRequest = {
		id,
		sender: senderId,
		receiver: receiverId,
		createdAt: new Date().toISOString(),
	};

	await putItem<RelationshipRequest, DatabaseRelationshipRequest>({
		pk: KeyPrefix.relationshipRequest.pk(id),
		sk: KeyPrefix.relationshipRequest.sk(id),
		gsi1pk: KeyPrefix.relationshipRequest.gsi1pk(),
		gsi1sk: KeyPrefix.relationshipRequest.gsi1sk(senderId),
		gsi2pk: KeyPrefix.relationshipRequest.gsi2pk(),
		gsi2sk: KeyPrefix.relationshipRequest.gsi2sk(receiverId),
		...request,
		entityType: EntityType.RELATIONSHIP_REQUEST,
	});

	return request;
};

export const getRelationshipRequestById = async (requestId: string) => {
	return getItem<RelationshipRequest>(
		KeyPrefix.relationshipRequest.pk(requestId),
		KeyPrefix.relationshipRequest.sk(requestId),
	);
};

export const getReceivedRelationshipRequestsForUser = ({
	userId,
	cursor,
	limit,
}: GetRelationshipRequestsForUserDto) => {
	return getRelationshipRequestsForUser({
		index: 'GSI2',
		userId,
		cursor,
		limit,
	});
};

export const getSentRelationshipRequestsForUser = ({ userId, cursor, limit }: GetRelationshipRequestsForUserDto) => {
	return getRelationshipRequestsForUser({
		index: 'GSI1',
		userId,
		cursor,
		limit,
	});
};

const getRelationshipRequestsForUser = async ({
	index,
	userId,
	cursor,
	limit,
}: GetRelationshipRequestsForUserDto & {
	index: 'GSI1' | 'GSI2';
}) => {
	const indexAttrib = index.toLowerCase();
	const res = await getItems<RelationshipRequest>({
		index,
		queryExpression: {
			expression: `#${indexAttrib}pk = :${indexAttrib}pk and #${indexAttrib}sk = :${indexAttrib}sk`,
			variables: {
				[`:${indexAttrib}pk`]:
					index === 'GSI1' ? KeyPrefix.relationshipRequest.gsi1pk() : KeyPrefix.relationshipRequest.gsi2pk(),
				[`:${indexAttrib}sk`]: (index === 'GSI1'
					? KeyPrefix.relationshipRequest.gsi1sk
					: KeyPrefix.relationshipRequest.gsi2sk)(userId),
			},
		},
		limit,
		cursor,
	});

	const batchedData = chunkArray(res.data, 25);
	const fetchedUsers = {} as Record<string, Pick<User, 'id' | 'username' | 'firstName' | 'lastName'>>;

	for (const batch of batchedData) {
		const userIds = {} as Record<string, string>;
		batch.forEach(request => {
			if (request.sender !== userId) userIds[request.id] = request.sender;
			else userIds[request.id] = request.receiver;
		});

		// Batch fetch users
		let batchRes = await dynamo.batchGet({
			RequestItems: {
				[process.env.TABLE_NAME!]: {
					Keys: Object.keys(userIds).map(
						id =>
							({
								pk: KeyPrefix.user.pk(userIds[id]),
								sk: KeyPrefix.user.sk(userIds[id]),
							}) as const,
					),
				},
			},
		});

		const resUsers = batchRes.Responses![process.env.TABLE_NAME!] as User[];
		resUsers.forEach(user => {
			const { id, username, firstName, lastName } = user;
			fetchedUsers[user.id] = { id, username, firstName, lastName };
		});
	}

	const requestsWithUsers = res.data.map(request => {
		const otherUser = fetchedUsers[request.sender === userId ? request.receiver : request.sender];
		return {
			...request,
			otherUser,
		};
	});

	return buildInfiniteData(requestsWithUsers, res.nextCursor);
};

export const deleteRelationshipRequestById = async (userId: string, requestId: string) => {
	const request = await getRelationshipRequestById(requestId);
	if (!request)
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'Relationship request not found',
		});

	if (request.receiver !== userId && request.sender !== userId)
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'You are not authorized to delete this relationship request',
		});

	return removeRelationshipRequestById(requestId);
};

const removeRelationshipRequestById = async (requestId: string) => {
	return deleteItem(KeyPrefix.relationshipRequest.pk(requestId), KeyPrefix.relationshipRequest.sk(requestId));
};

export const acceptRelationshipRequest = async (userId: string, requestId: string) => {
	const relationshipRequest = await getRelationshipRequestById(requestId);
	if (!relationshipRequest)
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'Relationship request not found',
		});

	const sender = await getUserById(relationshipRequest.sender);
	const receiver = await getUserById(relationshipRequest.receiver);

	if (!sender || !receiver) {
		await removeRelationshipRequestById(requestId);
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'User not found',
		});
	}

	if (receiver.id !== userId)
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'You are not authorized to accept this relationship request',
		});

	const relationshipId = getUUID();
	const relationship: Relationship = {
		id: relationshipId,
		partner1: sender.id,
		partner2: receiver.id,
		createdAt: new Date().toISOString(),
	};

	try {
		await writeTransaction(
			{
				put: {
					item: {
						pk: KeyPrefix.relationship.pk(relationshipId),
						sk: KeyPrefix.relationship.sk(relationshipId),
						...relationship,
						entityType: EntityType.RELATIONSHIP,
					} satisfies DatabaseRelationship,
				},
			},
			{
				deleteItem: {
					pk: KeyPrefix.relationshipRequest.pk(requestId),
					sk: KeyPrefix.relationshipRequest.sk(requestId),
				},
			},
			{
				update: {
					pk: KeyPrefix.user.pk(sender.id),
					sk: KeyPrefix.user.sk(sender.id),
					update: { relationshipId } satisfies Partial<User>,
				},
			},
			{
				update: {
					pk: KeyPrefix.user.pk(receiver.id),
					sk: KeyPrefix.user.sk(receiver.id),
					update: { relationshipId } satisfies Partial<User>,
				},
			},
		);

		return { ...relationship, sender };
	} catch (e) {
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Something went wrong!',
			cause: e,
		});
	}
};

export const deleteUserRelationship = async (userId: string) => {
	const relationship = await getRelationshipForUser(userId);
	if (!relationship)
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'Relationship not found',
		});

	try {
		await writeTransaction(
			{
				update: {
					pk: KeyPrefix.user.pk(relationship.partner1),
					sk: KeyPrefix.user.sk(relationship.partner1),
					update: { relationshipId: null } satisfies Nullable<Partial<User>>,
				},
			},
			{
				update: {
					pk: KeyPrefix.user.pk(relationship.partner2),
					sk: KeyPrefix.user.sk(relationship.partner2),
					update: { relationshipId: null } satisfies Nullable<Partial<User>>,
				},
			},
			{
				deleteItem: {
					pk: KeyPrefix.relationship.pk(relationship.id),
					sk: KeyPrefix.relationship.sk(relationship.id),
				},
			},
		);

		return relationship;
	} catch (e) {
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Something went wrong!',
			cause: e,
		});
	}
};
