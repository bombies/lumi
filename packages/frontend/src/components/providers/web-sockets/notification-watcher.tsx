'use client';

import type { InferredWebSocketMessagePayload } from '@lumi/core/websockets/websockets.types';
import type { FC } from 'react';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { StoreNotification } from '@/hooks/trpc/notification-hooks';
import { GetSelfUserOnDemand } from '@/hooks/trpc/user-hooks';
import { useRelationship } from '../relationships/relationship-provder';
import { useWebSocket } from './web-socket-provider';

const NotificationWatcher: FC = () => {
	const { selfState } = useRelationship();
	const { addEventHandler, removeEventHandler } = useWebSocket();
	const { mutateAsync: getSelf } = GetSelfUserOnDemand();
	const { mutateAsync: storeNotification } = StoreNotification();

	useEffect(() => {
		const handleNotification = async (payload: InferredWebSocketMessagePayload<'notification'>) => {
			const self = await getSelf();
			if (!self) return;

			if (self.status === 'online') {
				// Handle notification ignores
				if (
					payload.message.title.includes('New Moment Message')
					&& selfState?.state?.state === 'viewingMomentMessages'
					&& selfState.state.payload.momentId === payload.metadata?.momentId
				) {
					return;
				}

				toast.info(payload.message.title, {
					description: payload.message.content,
				});
				await storeNotification({
					title: payload.message.title,
					content: payload.message.content,
					read: true,
					openUrl: payload.openUrl,
				});
			}
		};

		addEventHandler('notification', handleNotification);

		return () => {
			removeEventHandler('notification', handleNotification);
		};
	}, [addEventHandler, getSelf, removeEventHandler, selfState, storeNotification]);

	return <></>;
};

export default NotificationWatcher;
