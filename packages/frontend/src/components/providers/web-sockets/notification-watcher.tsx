'use client';

import { FC, useEffect } from 'react';
import { InferredWebSocketMessagePayload } from '@lumi/core/types/websockets.types';
import { toast } from 'sonner';

import { GetSelfUserOnDemand } from '@/hooks/trpc/user-hooks';
import { useWebSocket } from './web-socket-provider';

const NotificationWatcher: FC = () => {
	const { addEventHandler, removeEventHandler } = useWebSocket();
	const { mutateAsync: getSelf } = GetSelfUserOnDemand();

	useEffect(() => {
		const handleNotification = async (payload: InferredWebSocketMessagePayload<'notification'>) => {
			const self = await getSelf();
			if (!self) return;

			if (self.status === 'online') toast.info(payload.message.content);
		};

		addEventHandler('notification', handleNotification);

		return () => {
			removeEventHandler('notification', handleNotification);
		};
	}, [addEventHandler, getSelf, removeEventHandler]);

	return <></>;
};

export default NotificationWatcher;
