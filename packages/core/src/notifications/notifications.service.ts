import { TRPCError } from '@trpc/server';
import webpush from 'web-push';

import { EntityType, KeyPrefix } from '../types/dynamo.types';
import { DatabaseNotificationSubscriber, NotificationSubscriber } from '../types/notification.types';
import { dynamo } from '../utils/dynamo/dynamo.service';

export const createNotificationSubscription = async (userId: string, subscription: PushSubscription) => {
	const sub: NotificationSubscriber = {
		subscriberId: userId,
		endpoint: subscription.endpoint,
		expirationTime: subscription.expirationTime,
		// @ts-expect-error Keys are not part of the PushSubscription type
		keys: subscription.keys,
	};

	const res = await dynamo.put({
		TableName: process.env.TABLE_NAME,
		Item: {
			pk: `${KeyPrefix.NOTIFICATION_SUBSCRIBER}${userId}`,
			sk: `${KeyPrefix.NOTIFICATION_SUBSCRIBER}${subscription.endpoint}`,
			entityType: EntityType.NOTIFICATION_SUBSCRIBER,
			...sub,
		} satisfies DatabaseNotificationSubscriber,
	});

	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to store subscription',
		});

	return sub;
};

export const deleteNotificationSubscription = async (userId: string, endpoint: string) => {
	const res = await dynamo.delete({
		TableName: process.env.TABLE_NAME,
		Key: {
			pk: `${KeyPrefix.NOTIFICATION_SUBSCRIBER}${userId}`,
			sk: `${KeyPrefix.NOTIFICATION_SUBSCRIBER}${endpoint}`,
		},
	});

	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to delete subscription',
		});
};

export const getNotificationSubscription = async (userId: string, endpoint: string) => {
	const res = await dynamo.get({
		TableName: process.env.TABLE_NAME,
		Key: {
			pk: `${KeyPrefix.NOTIFICATION_SUBSCRIBER}${userId}`,
			sk: `${KeyPrefix.NOTIFICATION_SUBSCRIBER}${endpoint}`,
		},
	});

	if (!res.Item) return null;

	return res.Item as DatabaseNotificationSubscriber;
};

export const getNotificationSubscriptions = async (userId: string) => {
	const res = await dynamo.query({
		TableName: process.env.TABLE_NAME,
		KeyConditionExpression: 'pk = :pk',
		ExpressionAttributeValues: {
			':pk': `${KeyPrefix.NOTIFICATION_SUBSCRIBER}${userId}`,
		},
	});

	return res.Items as NotificationSubscriber[];
};
