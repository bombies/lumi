'use server';

import {
	createNotificationSubscription,
	deleteNotificationSubscription,
	getNotificationSubscriptions,
} from '@lumi/core/notifications/notifications.service';
import { NotificationSubscriber } from '@lumi/core/types/notification.types';
import webpush, { PushSubscription as WebPushSubscription } from 'web-push';

import { getServerSession } from '@/lib/better-auth/auth-actions';

webpush.setVapidDetails(
	'mailto:contact@ajani.me',
	process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
	process.env.VAPID_PRIVATE_KEY!,
);

const subscriptions: Record<
	string,
	Pick<NotificationSubscriber, 'endpoint' | 'expirationTime' | 'keys'>[] | null | undefined
> = {};

const fetchSubscriptionsForUser = async (userId: string) => {
	const subs = await getNotificationSubscriptions(userId);
	if (!subs.length) return;

	subscriptions[userId] = subs.map(sub => ({
		endpoint: sub.endpoint,
		expirationTime: sub.expirationTime,
		keys: sub.keys,
	}));
};

export async function subscribeUser(sub: PushSubscription) {
	const session = await getServerSession();
	if (!session) return { success: false, error: 'Unauthorized' };

	await createNotificationSubscription(session.user.id, sub as unknown as WebPushSubscription);
	fetchSubscriptionsForUser(session.user.id);
	return { success: true };
}

export async function unsubscribeUser(endpoint: string) {
	const session = await getServerSession();
	if (!session) return { success: false, error: 'Unauthorized' };

	deleteNotificationSubscription(session.user.id, endpoint);
	subscriptions[session.user.id] = subscriptions[session.user.id]?.filter(sub => sub?.endpoint !== endpoint);
	return { success: true };
}

export type SendNotificationArgs = {
	message: string;
	title: string;
	icon?: string;
};

export async function sendUserNotification({ message, title, icon = '/favicon-96x96.png' }: SendNotificationArgs) {
	const session = await getServerSession();
	if (!session) return { success: false, error: 'Unauthorized' };

	const subs = subscriptions[session.user.id];
	if (!subs) return { success: false, error: 'No subscriptions found' };

	for (const sub of subs) {
		try {
			// TODO: Store notification for user
			await webpush.sendNotification(
				sub,
				JSON.stringify({
					title: title,
					body: message,
					icon: icon,
				}),
			);
			return { success: true };
		} catch (error) {
			console.error('Error sending push notification:', error);
			return { success: false, error: 'Failed to send notification' };
		}
	}
}
