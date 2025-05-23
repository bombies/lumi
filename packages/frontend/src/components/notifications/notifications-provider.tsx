'use client';

import type { FC, PropsWithChildren } from 'react';
import type { SendNotificationArgs } from './notification-actions';
import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';

import { logger } from '@/lib/logger';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { sendUserNotification, subscribeUser, unsubscribeUser } from './notification-actions';

const urlBase64ToUint8Array = (base64String: string) => {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
};

type NotificationsData = {
	isSupported: boolean;
	subscription: PushSubscription | null;
	subscribe: () => Promise<void>;
	unsubscribe: () => Promise<void>;
	sendNotification: (args: SendNotificationArgs) => Promise<void>;
	browserAllowsNotifications: boolean;
};

const NotificationsContext = createContext<NotificationsData | undefined>(undefined);

export const useNotifications = () => {
	const context = use(NotificationsContext);
	if (!context) throw new Error('useNotifications must be used within a NotificationsProvider');
	return context;
};

type NotificationsProviderProps = PropsWithChildren;

const NotificationsProvider: FC<NotificationsProviderProps> = ({ children }) => {
	const [browserAllowsNotifications, setBrowserAllowsNotifications] = useState(false);
	const [isSupported, setIsSupported] = useState(false);
	const [subscription, setSubscription] = useState<PushSubscription | null>(null);
	const [showNotificationDialog, setShowNotificationDialog] = useState(false);

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
		const registration = await navigator.serviceWorker.ready;
		if (!subscription) return;

		await subscription?.unsubscribe();
		await registration?.unregister();
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
		try {
			setBrowserAllowsNotifications(true);
		} catch (e: any) {
			if (e instanceof ReferenceError && e.message.includes('Notification')) setBrowserAllowsNotifications(false);
			else logger.error(e);
		}
	}, []);

	useEffect(() => {
		if ('serviceWorker' in navigator && 'PushManager' in window) {
			(async () => {
				// @ts-expect-error Type def not setup for chromium based browsers
				if (window.chrome) {
					const canNotify = await Notification.requestPermission();
					if (canNotify === 'granted') {
						setIsSupported(true);
						registerServiceWorker();
						subscribe();
					}
				} else {
					if (Notification.permission === 'granted') {
						setIsSupported(true);
						registerServiceWorker();
						subscribe();
					} else setShowNotificationDialog(true);
				}
			})();
		}
	}, [registerServiceWorker, showNotificationDialog, subscribe]);

	const dataValue = useMemo<NotificationsData>(
		() => ({
			isSupported,
			subscription,
			subscribe,
			unsubscribe,
			sendNotification,
			browserAllowsNotifications,
		}),
		[browserAllowsNotifications, isSupported, sendNotification, subscribe, subscription, unsubscribe],
	);

	return (
		<NotificationsContext value={dataValue}>
			<Dialog
				open={browserAllowsNotifications && Notification.permission === 'default' && showNotificationDialog}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Enable Notifications</DialogTitle>
					</DialogHeader>
					<p>You can receive real-time notifcations from lumi. Press the button below to opt in or out.</p>
					<Button
						onClick={async () => {
							const canNotify = await Notification.requestPermission();
							if (canNotify === 'granted') {
								if ('serviceWorker' in navigator && 'PushManager' in window) {
									setIsSupported(true);
									registerServiceWorker();

									if (!subscription) subscribe();
								}
							}
							setShowNotificationDialog(false);
						}}
					>
						Setup Notifications
					</Button>
				</DialogContent>
			</Dialog>
			{children}
		</NotificationsContext>
	);
};

export default NotificationsProvider;
