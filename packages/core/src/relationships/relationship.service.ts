import { TRPCError } from '@trpc/server';

import { EntityType, KeyPrefix } from '../types/dynamo.types';
import { buildInfiniteData, getInfiniteData } from '../types/infinite-data.dto';
import {
	DatabaseRelationship,
	DatabaseRelationshipRequest,
	Relationship,
	RelationshipRequest,
} from '../types/relationship.types';
import { User } from '../types/user.types';
import { getUserById } from '../users/users.service';
import { dynamo, getDynamicUpdateStatements } from '../utils/dynamo/dynamo.service';
import { chunkArray, getUUID } from '../utils/utils';
import { GetRelationshipRequestsForUserDto } from './relationship.dto';

export const getRelationshipById = async (relationshipId: string) => {
	const res = await dynamo.get({
		TableName: process.env.TABLE_NAME,
		Key: {
			pk: `${KeyPrefix.RELATIONSHIP}${relationshipId}`,
			sk: `${KeyPrefix.RELATIONSHIP}${relationshipId}`,
		},
	});

	return res.Item as Relationship | undefined;
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

export const getRelationshipReqeustBySenderAndReceiver = async (senderId: string, receiverId: string) => {
	const res = await dynamo.query({
		TableName: process.env.TABLE_NAME,
		IndexName: 'GSI1',
		KeyConditionExpression: '#pk = :pk and #sk = :sk',
		FilterExpression: '#gsi2pk = :gsi2pk and #gsi2sk = :gsi2sk',
		ExpressionAttributeNames: {
			'#pk': 'gsi1pk',
			'#sk': 'gsi1sk',
			'#gsi2pk': 'gsi2pk',
			'#gsi2sk': 'gsi2sk',
		},
		ExpressionAttributeValues: {
			':gsi2pk': `${KeyPrefix.RELATIONSHIP_REQUEST_RECEIVER}`,
			':gsi2sk': `${KeyPrefix.RELATIONSHIP_REQUEST_RECEIVER}#${receiverId}`,
			':pk': `${KeyPrefix.RELATIONSHIP_REQUEST_SENDER}`,
			':sk': `${KeyPrefix.RELATIONSHIP_REQUEST_SENDER}#${senderId}`,
		},
	});

	return res.Items?.[0] as RelationshipRequest | undefined;
};

export const userHasRequestFromUser = async (userId: string, senderId: string) => {
	return !!(await getRelationshipReqeustBySenderAndReceiver(senderId, userId));
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

	const requestFromReceiver = await getRelationshipReqeustBySenderAndReceiver(receiverId, senderId);
	if (requestFromReceiver) return await acceptRelationshipRequest(receiverId, requestFromReceiver.id);

	const id = getUUID();
	const request: RelationshipRequest = {
		id,
		sender: senderId,
		receiver: receiverId,
		createdAt: new Date().toISOString(),
	};

	const res = await dynamo.put({
		TableName: process.env.TABLE_NAME,
		Item: {
			pk: `${KeyPrefix.RELATIONSHIP_REQUEST}${id}`,
			sk: `${KeyPrefix.RELATIONSHIP_REQUEST}${id}`,
			gsi1pk: `${KeyPrefix.RELATIONSHIP_REQUEST_SENDER}`,
			gsi1sk: `${KeyPrefix.RELATIONSHIP_REQUEST_SENDER}#${senderId}`,
			gsi2pk: `${KeyPrefix.RELATIONSHIP_REQUEST_RECEIVER}`,
			gsi2sk: `${KeyPrefix.RELATIONSHIP_REQUEST_RECEIVER}#${receiverId}`,
			...request,
			entityType: EntityType.RELATIONSHIP_REQUEST,
		} satisfies DatabaseRelationshipRequest,
	});

	if (res.$metadata.httpStatusCode !== 200) {
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to send relationship request',
		});
	}

	return request;
};

export const getRelationshipRequestById = async (requestId: string) => {
	const res = await dynamo.get({
		TableName: process.env.TABLE_NAME,
		Key: {
			pk: `${KeyPrefix.RELATIONSHIP_REQUEST}${requestId}`,
			sk: `${KeyPrefix.RELATIONSHIP_REQUEST}${requestId}`,
		},
	});

	return res.Item as RelationshipRequest | undefined;
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
	const res = await dynamo.query({
		TableName: process.env.TABLE_NAME,
		IndexName: index,
		KeyConditionExpression: '#pk = :pk and #sk = :sk',
		ExpressionAttributeNames: {
			'#pk': `${index.toLowerCase()}pk`,
			'#sk': `${index.toLowerCase()}sk`,
		},
		ExpressionAttributeValues: {
			':pk': `${KeyPrefix.RELATIONSHIP_REQUEST_RECEIVER}`,
			':sk': `${KeyPrefix.RELATIONSHIP_REQUEST_RECEIVER}#${userId}`,
		},
		Limit: limit,
		ExclusiveStartKey: cursor,
	});

	const data = (res.Items ?? []) as RelationshipRequest[];
	const batchedData = chunkArray(data, 25);
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
								pk: `${KeyPrefix.USER}${userIds[id]}`,
								sk: `${KeyPrefix.USER}${userIds[id]}`,
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

	const requestsWithUsers = data.map(request => {
		const otherUser = fetchedUsers[request.sender === userId ? request.receiver : request.sender];
		return {
			...request,
			otherUser,
		};
	});

	return buildInfiniteData(requestsWithUsers, res.LastEvaluatedKey);
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
	const res = await dynamo.delete({
		TableName: process.env.TABLE_NAME,
		Key: {
			pk: `${KeyPrefix.RELATIONSHIP_REQUEST}${requestId}`,
			sk: `${KeyPrefix.RELATIONSHIP_REQUEST}${requestId}`,
		},
	});

	if (res.$metadata.httpStatusCode !== 200) {
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to delete relationship request',
		});
	}
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

	const { updateStatements, expressionAttributeNames, expressionAttributeValues } = getDynamicUpdateStatements<User>({
		relationshipId,
	});

	try {
		const res = await dynamo.transactWrite({
			TransactItems: [
				{
					Put: {
						TableName: process.env.TABLE_NAME,
						Item: {
							pk: `${KeyPrefix.RELATIONSHIP}${relationshipId}`,
							sk: `${KeyPrefix.RELATIONSHIP}${relationshipId}`,
							...relationship,
							entityType: EntityType.RELATIONSHIP,
						} as DatabaseRelationship,
					},
				},
				{
					Delete: {
						TableName: process.env.TABLE_NAME,
						Key: {
							pk: `${KeyPrefix.RELATIONSHIP_REQUEST}${requestId}`,
							sk: `${KeyPrefix.RELATIONSHIP_REQUEST}${requestId}`,
						},
					},
				},
				{
					Update: {
						TableName: process.env.TABLE_NAME,
						Key: {
							pk: `${KeyPrefix.USER}${sender.id}`,
							sk: `${KeyPrefix.USER}${sender.id}`,
						},
						UpdateExpression: updateStatements,
						ExpressionAttributeNames: expressionAttributeNames,
						ExpressionAttributeValues: expressionAttributeValues,
					},
				},
				{
					Update: {
						TableName: process.env.TABLE_NAME,
						Key: {
							pk: `${KeyPrefix.USER}${receiver.id}`,
							sk: `${KeyPrefix.USER}${receiver.id}`,
						},
						UpdateExpression: updateStatements,
						ExpressionAttributeNames: expressionAttributeNames,
						ExpressionAttributeValues: expressionAttributeValues,
					},
				},
			],
		});

		if (res.$metadata.httpStatusCode !== 200) {
			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
				message: 'Failed to accept relationship request',
			});
		}

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

	const { updateStatements, expressionAttributeNames, expressionAttributeValues } = getDynamicUpdateStatements<User>({
		relationshipId: null,
	});
	try {
		const res = await dynamo.transactWrite({
			TransactItems: [
				{
					Update: {
						TableName: process.env.TABLE_NAME,
						Key: {
							pk: `${KeyPrefix.USER}${relationship.partner1}`,
							sk: `${KeyPrefix.USER}${relationship.partner1}`,
						},
						UpdateExpression: updateStatements,
						ExpressionAttributeNames: expressionAttributeNames,
						ExpressionAttributeValues: expressionAttributeValues,
					},
				},
				{
					Update: {
						TableName: process.env.TABLE_NAME,
						Key: {
							pk: `${KeyPrefix.USER}${relationship.partner2}`,
							sk: `${KeyPrefix.USER}${relationship.partner2}`,
						},
						UpdateExpression: updateStatements,
						ExpressionAttributeNames: expressionAttributeNames,
						ExpressionAttributeValues: expressionAttributeValues,
					},
				},
				{
					Delete: {
						TableName: process.env.TABLE_NAME,
						Key: {
							pk: `${KeyPrefix.RELATIONSHIP}${relationship.id}`,
							sk: `${KeyPrefix.RELATIONSHIP}${relationship.id}`,
						},
					},
				},
			],
		});

		if (res.$metadata.httpStatusCode !== 200) {
			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
				message: 'Failed to delete relationship',
			});
		}

		return relationship;
	} catch (e) {
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Something went wrong!',
			cause: e,
		});
	}
};
