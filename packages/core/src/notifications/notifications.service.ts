import { TRPCError } from '@trpc/server';
import { Resource } from 'sst';
import webpush, { PushSubscription } from 'web-push';

import { EntityType, KeyPrefix } from '../types/dynamo.types';
import {
	DatabaseNotificationSubscriber,
	DatabaseStoredNotification,
	DatabaseUnreadNotificationCount,
	NotificationSubscriber,
	StoredNotification,
	UnreadNotificationCount,
} from '../types/notification.types';
import { User } from '../types/user.types';
import { deleteItem, dynamo, getItem, getItems, putItem, updateItem, updateMany } from '../utils/dynamo/dynamo.service';
import { getUUID } from '../utils/utils';
import { MqttClientType, emitAsyncWebsocketEvent } from '../websockets/websockets.service';
import {
	CreateNotificationDto,
	GetFilteredNotificationsDto,
	GetNotificationsDto,
	UpdateNotificationDto,
	updateNotificationDto,
} from './notification.dto';

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
		metadata?: Record<string, any>;
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
			console.log(
				'Attempting to send notifcation with payload',
				JSON.stringify({
					title: payload.title.slice(0, Math.min(30, payload.title.length)),
					body: payload.body.slice(0, Math.min(150, payload.body.length)),
					icon: '/favicon-96x96.png',
					openUrl: payload.openUrl,
				}),
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

			await storeNotification(user.id, {
				title: payload.title,
				content: payload.body,
				openUrl: payload.openUrl,
			});
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
					metadata: payload.metadata,
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

export const storeNotification = async (userId: string, dto: CreateNotificationDto) => {
	const id = getUUID();
	const notification: StoredNotification = {
		id,
		userId,
		read: false,
		...dto,
		createdAt: new Date().toISOString(),
	};

	const notif = await putItem<StoredNotification, DatabaseStoredNotification>({
		pk: KeyPrefix.notifications.pk(id),
		sk: KeyPrefix.notifications.sk(id),
		gsi1pk: KeyPrefix.notifications.gsi1pk(userId),
		gsi1sk: KeyPrefix.notifications.gsi1sk(notification.createdAt),
		gsi2pk: KeyPrefix.notifications.gsi2pk(userId),
		gsi2sk: KeyPrefix.notifications.gsi2sk(notification.read, notification.createdAt),
		...notification,
		entityType: EntityType.NOTIFICATION,
	});

	if (!notif.read) await addUnreadNotificationToCount(userId);
	return notif;
};

export const getStoredNotifications = async (userId: string, dto: GetNotificationsDto) => {
	return getItems<StoredNotification>({
		index: 'GSI1',
		queryExpression: {
			expression: '#gsi1pk = :gsi1pk',
			variables: {
				':gsi1pk': KeyPrefix.notifications.gsi1pk(userId),
			},
		},
		order: 'desc',
		cursor: dto.cursor,
		limit: dto.limit,
	});
};

export const getFilteredStoredNotifications = async (userId: string, dto: GetFilteredNotificationsDto) => {
	return getItems<StoredNotification>({
		index: 'GSI2',
		queryExpression: {
			expression: '#gsi2pk = :gsi2pk and begins_with(#gsi2sk, :gsi2sk)',
			variables: {
				':gsi2pk': KeyPrefix.notifications.gsi2pk(userId),
				':gsi2sk': KeyPrefix.notifications.buildKey(dto.filter),
			},
		},
		order: 'desc',
		cursor: dto.cursor,
		limit: dto.limit,
	});
};

export const updateNotification = async (notificationId: string, dto: UpdateNotificationDto) => {
	const oldNotif = await getItem<DatabaseStoredNotification>(
		KeyPrefix.notifications.pk(notificationId),
		KeyPrefix.notifications.sk(notificationId),
	);
	if (!oldNotif)
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'Notification not found',
		});

	const res = await updateItem<DatabaseStoredNotification>({
		pk: KeyPrefix.notifications.pk(notificationId),
		sk: KeyPrefix.notifications.sk(notificationId),
		update: {
			...dto,
			gsi2sk: dto.read !== undefined ? KeyPrefix.notifications.gsi2sk(dto.read, oldNotif.createdAt) : undefined,
		},
	});

	if (!oldNotif.read && res.read) await removeUnreadNotificationFromCount(oldNotif.userId);
	else if (oldNotif.read && !res.read) await addUnreadNotificationToCount(oldNotif.userId);

	return res;
};

export const markAllNotificationsAsRead = async (userId: string) => {
	const unreadNotifications = await getItems<DatabaseStoredNotification>({
		index: 'GSI2',
		queryExpression: {
			expression: '#gsi2pk = :gsi2pk and begins_with(#gsi2sk, :gsi2sk)',
			variables: {
				':gsi2pk': KeyPrefix.notifications.gsi1pk(userId),
				':gsi2sk': KeyPrefix.notifications.buildKey('unread'),
			},
		},
		exhaustive: true,
	});

	const res = await updateMany<DatabaseStoredNotification>(
		unreadNotifications.data?.map(notif => ({
			pk: notif.pk,
			sk: notif.sk,
			update: { read: true, gsi2sk: KeyPrefix.notifications.gsi2sk(true, notif.createdAt) },
		})) ?? [],
	);

	if (unreadNotifications.data?.length) await updateUnreadNotificationCount(userId, 0);
	return res;
};

export const markBulkNotificationsAsRead = async (
	userId: string,
	notificationData: { id: string; createdAt: string }[],
) => {
	const res = await updateMany<DatabaseStoredNotification>(
		[...new Set(notificationData)].map(data => ({
			pk: KeyPrefix.notifications.pk(data.id),
			sk: KeyPrefix.notifications.sk(data.id),
			update: { read: true, gsi2sk: KeyPrefix.notifications.gsi2sk(true, data.createdAt) },
		})),
	);

	const currentCount = await getUnreadNotificationCount(userId);
	await updateUnreadNotificationCount(userId, (currentCount?.count ?? 0) - notificationData.length);

	return res;
};

// export const deleteNotification = async (notificationId: string) => {
// 	return deleteItem(KeyPrefix.notifications.pk(notificationId), KeyPrefix.notifications.sk(notificationId));
// };

export const getUnreadNotificationCount = async (userId: string) => {
	return getItem<UnreadNotificationCount>(
		KeyPrefix.unreadNotificationCount.pk(userId),
		KeyPrefix.unreadNotificationCount.sk(userId),
	);
};

export const addUnreadNotificationToCount = async (userId: string) => {
	const existingCount = await getUnreadNotificationCount(userId);
	if (existingCount)
		return updateItem<UnreadNotificationCount>({
			pk: KeyPrefix.unreadNotificationCount.pk(userId),
			sk: KeyPrefix.unreadNotificationCount.sk(userId),
			update: { count: existingCount.count + 1 },
		});

	return putItem<UnreadNotificationCount, DatabaseUnreadNotificationCount>({
		pk: KeyPrefix.unreadNotificationCount.pk(userId),
		sk: KeyPrefix.unreadNotificationCount.pk(userId),
		userId,
		count: 1,
		entityType: EntityType.UNREAD_NOTIFICATION_COUNT,
	});
};

export const removeUnreadNotificationFromCount = async (userId: string) => {
	const existingCount = await getUnreadNotificationCount(userId);
	if (!existingCount) {
		return putItem<UnreadNotificationCount, DatabaseUnreadNotificationCount>({
			pk: KeyPrefix.unreadNotificationCount.pk(userId),
			sk: KeyPrefix.unreadNotificationCount.pk(userId),
			userId,
			count: 0,
			entityType: EntityType.UNREAD_NOTIFICATION_COUNT,
		});
	}

	return updateItem<UnreadNotificationCount>({
		pk: KeyPrefix.unreadNotificationCount.pk(userId),
		sk: KeyPrefix.unreadNotificationCount.sk(userId),
		update: { count: Math.max(0, existingCount.count - 1) },
	});
};

export const updateUnreadNotificationCount = async (userId: string, count: number) => {
	return putItem<UnreadNotificationCount, DatabaseUnreadNotificationCount>({
		pk: KeyPrefix.unreadNotificationCount.pk(userId),
		sk: KeyPrefix.unreadNotificationCount.sk(userId),
		userId,
		count: Math.max(0, count),
		entityType: EntityType.UNREAD_NOTIFICATION_COUNT,
	});
};
