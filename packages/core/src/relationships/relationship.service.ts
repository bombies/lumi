import { TRPCError } from '@trpc/server';

import { EntityType, KeyPrefix } from '../types/dynamo.types';
import { getInfiniteData } from '../types/infinite-data.dto';
import {
	DatabaseRelationship,
	DatabaseRelationshipRequest,
	Relationship,
	RelationshipRequest,
} from '../types/relationship.types';
import { User } from '../types/user.types';
import { getUserById } from '../users/users.service';
import { dynamo, getDynamicUpdateStatements } from '../utils/dynamo/dynamo.service';
import { getUUID } from '../utils/utils';
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

export const userHasRequestFromUser = async (userId: string, senderId: string) => {
	const res = await dynamo.query({
		TableName: process.env.TABLE_NAME,
		IndexName: 'GSI2',
		KeyConditionExpression: '#pk = :pk and #sk = :sk and #gsi1pk = :gsi1pk and #gsi1sk = :gsi1sk',
		ExpressionAttributeNames: {
			'#pk': 'gsi2pk',
			'#sk': 'gsi2sk',
			'#gsi1pk': 'gsi1pk',
			'#gsi1sk': 'gsi1sk',
		},
		ExpressionAttributeValues: {
			':pk': `${KeyPrefix.RELATIONSHIP_REQUEST_RECEIVER}`,
			':sk': `${KeyPrefix.RELATIONSHIP_REQUEST_RECEIVER}#${userId}`,
			':gsi1pk': `${KeyPrefix.RELATIONSHIP_REQUEST_SENDER}`,
			':gsi1sk': `${KeyPrefix.RELATIONSHIP_REQUEST_SENDER}#${senderId}`,
		},
	});

	return !!res.Items?.length;
};

export const sendRelationshipRequest = async (senderId: string, receiverId: string) => {
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

	if (await userHasRequestFromUser(senderId, receiverId))
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'You already have already sent this user a request!',
		});

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
			pk: `${KeyPrefix.RELATIONSHIP_REQUEST}${senderId}`,
			sk: `${KeyPrefix.RELATIONSHIP_REQUEST}${receiverId}`,
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

	return getInfiniteData<RelationshipRequest>(res);
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

	if (sender.id !== userId)
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

		return relationship;
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
					Delete: {
						TableName: process.env.TABLE_NAME,
						Key: {
							pk: `${KeyPrefix.RELATIONSHIP}${relationship.id}`,
							sk: `${KeyPrefix.RELATIONSHIP}${relationship.id}`,
						},
					},
				},
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
