'use client';

import type { PropsWithChildren } from 'react';
import type { SendNotificationArgs } from './notification-actions';
import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';

import { logger } from '@/lib/logger';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { sendUserNotification, subscribeUser, unsubscribeUser } from './notification-actions';

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let i = 0; i < rawData.length; i++) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
};

const isNotificationSupported = (): boolean => {
	return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
};

type NotificationsContextValue = {
	isSupported: boolean;
	subscription: PushSubscription | null;
	subscribe: () => Promise<void>;
	unsubscribe: () => Promise<void>;
	sendNotification: (args: SendNotificationArgs) => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export const useNotifications = (): NotificationsContextValue => {
	const context = use(NotificationsContext);
	if (!context) {
		throw new Error('useNotifications must be used within a NotificationsProvider');
	}
	return context;
};

const NotificationsProvider = ({ children }: PropsWithChildren) => {
	const [isSupported, setIsSupported] = useState(false);
	const [subscription, setSubscription] = useState<PushSubscription | null>(null);
	const [showDialog, setShowDialog] = useState(false);

	const registerServiceWorker = useCallback(async (): Promise<void> => {
		try {
			const registration = await navigator.serviceWorker.register('/notification-worker.js', {
				scope: '/',
				updateViaCache: 'none',
			});
			const existingSub = await registration.pushManager.getSubscription();
			setSubscription(existingSub);
		} catch (error) {
			logger.error('Failed to register service worker:', error);
		}
	}, []);

	const subscribe = useCallback(async (): Promise<void> => {
		try {
			const registration = await navigator.serviceWorker.ready;
			const newSub = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
			});
			setSubscription(newSub);
			await subscribeUser(JSON.parse(JSON.stringify(newSub)));
		} catch (error) {
			logger.error('Failed to subscribe to notifications:', error);
		}
	}, []);

	const unsubscribe = useCallback(async (): Promise<void> => {
		if (!subscription) return;

		try {
			await subscription.unsubscribe();
			await unsubscribeUser(subscription.endpoint);
			setSubscription(null);
		} catch (error) {
			logger.error('Failed to unsubscribe from notifications:', error);
		}
	}, [subscription]);

	const sendNotification = useCallback(
		async (args: SendNotificationArgs): Promise<void> => {
			if (!subscription) return;
			try {
				await sendUserNotification(args);
			} catch (error) {
				logger.error('Failed to send notification:', error);
			}
		},
		[subscription],
	);

	const handlePermissionRequest = useCallback(async (): Promise<void> => {
		try {
			const permission = await Notification.requestPermission();
			if (permission === 'granted') {
				setIsSupported(true);
				await registerServiceWorker();
				if (!subscription) {
					await subscribe();
				}
			}
		} catch (error) {
			logger.error('Failed to request notification permission:', error);
		} finally {
			setShowDialog(false);
		}
	}, [registerServiceWorker, subscribe, subscription]);

	useEffect(() => {
		if (!isNotificationSupported()) return;

		const initializeNotifications = async () => {
			if (Notification.permission === 'granted') {
				setIsSupported(true);
				await registerServiceWorker();
				if (!subscription) {
					await subscribe();
				}
			} else if (Notification.permission === 'default') {
				setShowDialog(true);
			}
		};

		initializeNotifications();
	}, [registerServiceWorker, subscribe, subscription]);

	const contextValue = useMemo<NotificationsContextValue>(
		() => ({
			isSupported,
			subscription,
			subscribe,
			unsubscribe,
			sendNotification,
		}),
		[isSupported, subscription, subscribe, unsubscribe, sendNotification],
	);

	return (
		<NotificationsContext.Provider value={contextValue}>
			<Dialog
				open={showDialog && Notification.permission === 'default'}
				onOpenChange={(open) => {
					if (!open) {
						setShowDialog(false);
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Enable Notifications</DialogTitle>
					</DialogHeader>
					<p>Receive real-time notifications from Lumi. Click below to enable or disable notifications.</p>
					<Button onClick={handlePermissionRequest}>
						Enable Notifications
					</Button>
				</DialogContent>
			</Dialog>
			{children}
		</NotificationsContext.Provider>
	);
};

export default NotificationsProvider;
