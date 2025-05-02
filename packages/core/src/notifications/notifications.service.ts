import type { PushSubscription } from 'web-push';
import type { User } from '../users/user.types';
import type { MqttClientType } from '../websockets/websockets.service';
import type {
	CreateNotificationDto,
	GetFilteredNotificationsDto,
	GetNotificationsDto,
	UpdateNotificationDto,
} from './notification.dto';

import type {
	DatabaseNotificationSubscriber,
	DatabaseStoredNotification,
	DatabaseUnreadNotificationCount,
	NotificationSubscriber,
	StoredNotification,
	UnreadNotificationCount,
} from './notification.types';
import { TRPCError } from '@trpc/server';
import { Resource } from 'sst';
import webpush from 'web-push';
import {
	batchWrite,
	deleteItem,
	getItem,
	getItems,
	putItem,
	updateItem,
	updateMany,
} from '../utils/dynamo/dynamo.service';
import { DynamoKey, EntityType } from '../utils/dynamo/dynamo.types';
import { chunkArray, getUUID } from '../utils/utils';
import { emitAsyncWebsocketEvent } from '../websockets/websockets.service';

export const createNotificationSubscription = async (userId: string, subscription: PushSubscription) => {
	const sub: NotificationSubscriber = {
		subscriberId: userId,
		endpoint: subscription.endpoint,
		expirationTime: subscription.expirationTime ?? null,
		keys: subscription.keys,
	};

	return putItem<NotificationSubscriber, DatabaseNotificationSubscriber>({
		pk: DynamoKey.notificationSubscriber.pk(userId),
		sk: DynamoKey.notificationSubscriber.sk(subscription.endpoint),
		entityType: EntityType.NOTIFICATION_SUBSCRIBER,
		...sub,
	});
};

export const deleteNotificationSubscription = async (userId: string, endpoint: string) => {
	return deleteItem(DynamoKey.notificationSubscriber.pk(userId), DynamoKey.notificationSubscriber.sk(endpoint));
};

export const getNotificationSubscription = async (userId: string, endpoint: string) => {
	return getItem<NotificationSubscriber>(
		DynamoKey.notificationSubscriber.pk(userId),
		DynamoKey.notificationSubscriber.sk(endpoint),
	);
};

export const getNotificationSubscriptions = async (userId: string) => {
	return getItems<NotificationSubscriber>({
		queryExpression: {
			expression: '#pk = :pk',
			variables: {
				':pk': DynamoKey.notificationSubscriber.pk(userId),
			},
		},
	});
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
					title: payload.title,
					body: payload.body,
					icon: '/favicon-96x96.png',
					openUrl: payload.openUrl,
				}),
			);
			for (const sub of notificationSubs.data) {
				try {
					const sendResult = await webpush.sendNotification(
						sub,
						JSON.stringify({
							title: payload.title,
							body: payload.body,
							icon: '/favicon-96x96.png',
							openUrl: payload.openUrl,
						}),
					);

					if (sendResult.statusCode !== 201 && sendResult.statusCode !== 200) {
						console.error(
							`(Code: ${sendResult.statusCode}) Failed to send notification to ${user.username}`,
							sendResult,
						);
						continue;
					}

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
		pk: DynamoKey.notifications.pk(id),
		sk: DynamoKey.notifications.sk(id),
		gsi1pk: DynamoKey.notifications.gsi1pk(userId),
		gsi1sk: DynamoKey.notifications.gsi1sk(notification.createdAt),
		gsi2pk: DynamoKey.notifications.gsi2pk(userId),
		gsi2sk: DynamoKey.notifications.gsi2sk(notification.read, notification.createdAt),
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
				':gsi1pk': DynamoKey.notifications.gsi1pk(userId),
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
				':gsi2pk': DynamoKey.notifications.gsi2pk(userId),
				':gsi2sk': DynamoKey.notifications.buildKey(dto.filter),
			},
		},
		order: 'desc',
		cursor: dto.cursor,
		limit: dto.limit,
	});
};

export const updateNotification = async (notificationId: string, dto: UpdateNotificationDto) => {
	const oldNotif = await getItem<DatabaseStoredNotification>(
		DynamoKey.notifications.pk(notificationId),
		DynamoKey.notifications.sk(notificationId),
	);
	if (!oldNotif)
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'Notification not found',
		});

	const res = await updateItem<DatabaseStoredNotification>({
		pk: DynamoKey.notifications.pk(notificationId),
		sk: DynamoKey.notifications.sk(notificationId),
		update: {
			...dto,
			gsi2sk: dto.read !== undefined ? DynamoKey.notifications.gsi2sk(dto.read, oldNotif.createdAt) : undefined,
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
				':gsi2pk': DynamoKey.notifications.gsi1pk(userId),
				':gsi2sk': DynamoKey.notifications.buildKey('unread'),
			},
		},
		exhaustive: true,
	});

	const res = await updateMany<DatabaseStoredNotification>(
		unreadNotifications.data?.map(notif => ({
			pk: notif.pk,
			sk: notif.sk,
			update: { read: true, gsi2sk: DynamoKey.notifications.gsi2sk(true, notif.createdAt) },
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
			pk: DynamoKey.notifications.pk(data.id),
			sk: DynamoKey.notifications.sk(data.id),
			update: { read: true, gsi2sk: DynamoKey.notifications.gsi2sk(true, data.createdAt) },
		})),
	);

	const currentCount = await getUnreadNotificationCount(userId);
	await updateUnreadNotificationCount(userId, (currentCount?.count ?? 0) - notificationData.length);

	return res;
};

// export const deleteNotification = async (notificationId: string) => {
// 	return deleteItem(KeyPrefix.notifications.pk(notificationId), KeyPrefix.notifications.sk(notificationId));
// };

export const deleteNotificationsForUser = async (userId: string) => {
	const notifications = (
		await getItems<DatabaseStoredNotification>({
			index: 'GSI1',
			queryExpression: {
				expression: `#gsi1pk = :gsi1sk`,
				variables: {
					':gsi1sk': DynamoKey.notifications.gsi1pk(userId),
				},
			},
			exhaustive: true,
		})
	).data;

	const unreadNotificationAggregate = await getItem<DatabaseUnreadNotificationCount>(
		DynamoKey.unreadNotificationCount.pk(userId),
		DynamoKey.unreadNotificationCount.sk(userId),
	);

	await Promise.all(
		chunkArray(
			unreadNotificationAggregate ? [...notifications, unreadNotificationAggregate] : notifications,
			25,
		).map(chunk =>
			batchWrite(
				...chunk.map(chunkItem => ({
					deleteItem: {
						pk: chunkItem.pk,
						sk: chunkItem.sk,
					},
				})),
			),
		),
	);

	return deleteItem(DynamoKey.unreadNotificationCount.pk(userId), DynamoKey.unreadNotificationCount.sk(userId));
};

export const getUnreadNotificationCount = async (userId: string) => {
	return getItem<UnreadNotificationCount>(
		DynamoKey.unreadNotificationCount.pk(userId),
		DynamoKey.unreadNotificationCount.sk(userId),
	);
};

export const addUnreadNotificationToCount = async (userId: string) => {
	const existingCount = await getUnreadNotificationCount(userId);
	if (existingCount)
		return updateItem<UnreadNotificationCount>({
			pk: DynamoKey.unreadNotificationCount.pk(userId),
			sk: DynamoKey.unreadNotificationCount.sk(userId),
			update: { count: existingCount.count + 1 },
		});

	return putItem<UnreadNotificationCount, DatabaseUnreadNotificationCount>({
		pk: DynamoKey.unreadNotificationCount.pk(userId),
		sk: DynamoKey.unreadNotificationCount.pk(userId),
		userId,
		count: 1,
		entityType: EntityType.UNREAD_NOTIFICATION_COUNT,
	});
};

export const removeUnreadNotificationFromCount = async (userId: string) => {
	const existingCount = await getUnreadNotificationCount(userId);
	if (!existingCount) {
		return putItem<UnreadNotificationCount, DatabaseUnreadNotificationCount>({
			pk: DynamoKey.unreadNotificationCount.pk(userId),
			sk: DynamoKey.unreadNotificationCount.pk(userId),
			userId,
			count: 0,
			entityType: EntityType.UNREAD_NOTIFICATION_COUNT,
		});
	}

	return updateItem<UnreadNotificationCount>({
		pk: DynamoKey.unreadNotificationCount.pk(userId),
		sk: DynamoKey.unreadNotificationCount.sk(userId),
		update: { count: Math.max(0, existingCount.count - 1) },
	});
};

export const updateUnreadNotificationCount = async (userId: string, count: number) => {
	return putItem<UnreadNotificationCount, DatabaseUnreadNotificationCount>({
		pk: DynamoKey.unreadNotificationCount.pk(userId),
		sk: DynamoKey.unreadNotificationCount.sk(userId),
		userId,
		count: Math.max(0, count),
		entityType: EntityType.UNREAD_NOTIFICATION_COUNT,
	});
};
