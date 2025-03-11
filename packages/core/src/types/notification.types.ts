import { EntityType } from './dynamo.types';

export type NotificationSubscriber = {
	subscriberId: string;
	keys: { auth: string; p256dh: string };
} & Pick<PushSubscription, 'endpoint' | 'expirationTime'>;

export type DatabaseNotificationSubscriber = NotificationSubscriber & {
	pk: string;
	sk: string;
	entityType: EntityType.NOTIFICATION_SUBSCRIBER;
};
