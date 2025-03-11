'use client';

import { createContext, FC, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { urlBase64ToUint8Array } from '@lumi/core/utils/utils';

import {
	SendNotificationArgs,
	sendUserNotification,
	subscribeUser,
	unsubscribeUser,
} from '@/components/notifications/notification-actions';

type NotificationsData = {
	isSupported: boolean;
	subscription: PushSubscription | null;
	subscribe: () => Promise<void>;
	unsubscribe: () => Promise<void>;
	sendNotification: (args: SendNotificationArgs) => Promise<void>;
};

const NotificationsContext = createContext<NotificationsData | undefined>(undefined);

export const useNotifications = () => {
	const context = useContext(NotificationsContext);
	if (!context) throw new Error('useNotifications must be used within a NotificationsProvider');
	return context;
};

const NotificationsProvider: FC<PropsWithChildren> = ({ children }) => {
	const [isSupported, setIsSupported] = useState(false);
	const [subscription, setSubscription] = useState<PushSubscription | null>(null);

	const registerServiceWorker = useCallback(async () => {
		const registration = await navigator.serviceWorker.register('/notification-worker.js', {
			scope: '/',
			updateViaCache: 'none',
		});
		const sub = await registration.pushManager.getSubscription();
		setSubscription(sub);
	}, []);

	const subscribe = useCallback(async () => {
		const registration = await navigator.serviceWorker.ready;
		const sub = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
		});
		setSubscription(sub);
		const serializedSub = JSON.parse(JSON.stringify(sub));
		await subscribeUser(serializedSub);
	}, []);

	const unsubscribe = useCallback(async () => {
		if (!subscription) return;

		await subscription?.unsubscribe();
		await unsubscribeUser(subscription.endpoint);
		setSubscription(null);
	}, [subscription]);

	const sendNotification = useCallback(
		async (args: SendNotificationArgs) => {
			if (subscription) await sendUserNotification(args);
		},
		[subscription],
	);

	useEffect(() => {
		if ('serviceWorker' in navigator && 'PushManager' in window) {
			setIsSupported(true);
			registerServiceWorker();

			if (!subscription) subscribe();
		}
	}, [registerServiceWorker, subscribe, subscription]);

	const dataValue = useMemo<NotificationsData>(
		() => ({
			isSupported,
			subscription,
			subscribe,
			unsubscribe,
			sendNotification,
		}),
		[isSupported, sendNotification, subscribe, subscription, unsubscribe],
	);

	return <NotificationsContext.Provider value={dataValue}>{children}</NotificationsContext.Provider>;
};

export default NotificationsProvider;
