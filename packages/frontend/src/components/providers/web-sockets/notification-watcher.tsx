'use client';

import { FC, useEffect } from 'react';
import { InferredWebSocketMessagePayload } from '@lumi/core/types/websockets.types';
import { toast } from 'sonner';

import { useNotifications } from '@/components/notifications/notifications-provider';
import { GetSelfUserOnDemand } from '@/hooks/trpc/user-hooks';
import { useWebSocket } from './web-socket-provider';

const NotificationWatcher: FC = () => {
	const { sendNotification } = useNotifications();
	const { addEventHandler, removeEventHandler } = useWebSocket();
	const { mutateAsync: getSelf } = GetSelfUserOnDemand();

	useEffect(() => {
		const handleNotification = async (payload: InferredWebSocketMessagePayload<'notification'>) => {
			const self = await getSelf();
			if (!self) return;

			if (self.status !== 'online') {
				sendNotification({
					title: payload.message.title.slice(0, Math.min(29, payload.message.content.length - 1)),
					message: payload.message.content.slice(0, Math.min(149, payload.message.content.length - 1)),
				});
			} else {
				toast.info(payload.message.content);
			}
		};

		addEventHandler('notification', handleNotification);

		return () => {
			removeEventHandler('notification', handleNotification);
		};
	}, [addEventHandler, getSelf, removeEventHandler, sendNotification]);

	return <></>;
};

export default NotificationWatcher;
