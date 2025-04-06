import { PushSubscription } from 'web-push';
import { z } from 'zod';

import { notificationSchema, unreadNotificationCountSchema } from '../notifications/notification.dto';
import { EntityType } from '../utils/dynamo/dynamo.types';

export type NotificationSubscriber = {
	subscriberId: string;
	keys: { auth: string; p256dh: string };
} & Pick<PushSubscription, 'endpoint' | 'expirationTime'>;

export type DatabaseNotificationSubscriber = NotificationSubscriber & {
	pk: string;
	sk: string;
	entityType: EntityType.NOTIFICATION_SUBSCRIBER;
};

export type StoredNotification = z.infer<typeof notificationSchema>;

export type DatabaseStoredNotification = StoredNotification & {
	pk: string;
	sk: string;
	gsi1pk: string;
	gsi1sk: string;
	gsi2pk: string;
	gsi2sk: string;
	entityType: EntityType.NOTIFICATION;
};

export type UnreadNotificationCount = z.infer<typeof unreadNotificationCountSchema>;

export type DatabaseUnreadNotificationCount = UnreadNotificationCount & {
	pk: string;
	sk: string;
	entityType: EntityType.UNREAD_NOTIFICATION_COUNT;
};
