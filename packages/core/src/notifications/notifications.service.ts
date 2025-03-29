import { TRPCError } from '@trpc/server';
import { Resource } from 'sst';
import webpush, { PushSubscription } from 'web-push';

import { EntityType, KeyPrefix } from '../types/dynamo.types';
import { DatabaseNotificationSubscriber, NotificationSubscriber } from '../types/notification.types';
import { User } from '../types/user.types';
import { dynamo } from '../utils/dynamo/dynamo.service';
import { MqttClientType, emitAsyncWebsocketEvent } from '../websockets/websockets.service';

export const createNotificationSubscription = async (userId: string, subscription: PushSubscription) => {
	const sub: NotificationSubscriber = {
		subscriberId: userId,
		endpoint: subscription.endpoint,
		expirationTime: subscription.expirationTime ?? null,
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

export const sendNotification = async ({
	user,
	payload,
	opts,
}: {
	user: User;
	payload: {
		title: string;
		body: string;
		openUrl?: string;
	};
	opts?: {
		offlineWebSocketMessage?: {
			mqttConnection: MqttClientType;
			topic: string;
		};
		onSuccess?: () => void;
	};
}) => {
	try {
		if (user.status === 'offline' || user.status === 'idle') {
			console.log(`${user.username} is offline or idle... Sending notification through webpush`);
			const notificationSubs = await getNotificationSubscriptions(user.id);
			webpush.setVapidDetails(
				'mailto:contact@ajani.me',
				Resource.VapidPublicKey.value,
				Resource.VapidPrivateKey.value,
			);
			for (const sub of notificationSubs) {
				try {
					await webpush.sendNotification(
						sub,
						JSON.stringify({
							title: payload.title.slice(0, Math.min(30, payload.title.length)),
							body: payload.body.slice(0, Math.min(150, payload.body.length)),
							icon: '/favicon-96x96.png',
							openUrl: payload.openUrl,
						}),
					);

					let subService: string;
					const endpoint = sub.endpoint;
					if (endpoint.includes('mozilla')) {
						subService = 'Mozilla';
					} else if (endpoint.includes('fcm')) {
						subService = 'Firebase Cloud Messaging';
					} else if (endpoint.includes('apple')) {
						subService = 'Apple';
					} else {
						subService = 'Unknown';
					}

					console.log(`Successfully sent the notification to the ${subService} subscriber!`);
				} catch (e) {
					console.error('Could not send the notifcation to a subscriber!', e);
				}
			}
		} else {
			if (!opts?.offlineWebSocketMessage)
				return console.log(`User ${user.username} is online... Skipping websocket notification`);

			console.log(`${user.username} is online... Sending notification through websocket`);
			const mqttConnection = opts.offlineWebSocketMessage.mqttConnection;
			const topic = opts.offlineWebSocketMessage.topic;
			await emitAsyncWebsocketEvent({
				client: mqttConnection,
				topic,
				event: 'notification',
				payload: {
					receiverId: user.id,
					from: {
						type: 'system',
					},
					message: {
						title: payload.title,
						content: payload.body,
					},
				},
				source: 'server',
			});
		}

		console.log(`Sent notifications to ${user.id}`);
		opts?.onSuccess?.();
	} catch (e) {
		console.error(`Could not send notification to ${user.username}`, e);
	}
};
