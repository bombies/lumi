'use client';

import { FC, useEffect } from 'react';
import { User } from '@lumi/core/types/user.types';
import { WebSocketEventHandler, WebSocketMessageMap } from '@lumi/core/types/websockets.types';

import { UpdateUser } from '@/app/(site)/(internal)/settings/(account)/trpc-hooks';
import { useWebSocket } from '@/components/providers/web-sockets/web-socket-provider';

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const HEART_BEAT_INTERVAL = 60 * 1000; // 1 minute

export const usePresenceWatcher = (user: User, relationshipId: string) => {
	const { emitEvent, addEventHandler, removeEventHandler } = useWebSocket();
	const { mutateAsync: updateUser } = UpdateUser();

	useEffect(() => {
		let timeOut: NodeJS.Timeout | undefined;
		let heartbeatInterval: NodeJS.Timeout | undefined;
		let message: WebSocketMessageMap['presence']['payload'] | undefined;

		const createTimeOut = () => {
			return setTimeout(async () => {
				if (message) {
					await updateUser({ status: 'idle' });
					emitEvent('presence', { ...message, status: 'idle' });
				}
			}, IDLE_TIMEOUT);
		};

		const handleTimerReset = async () => {
			if (message && message.status === 'idle') {
				await updateUser({ status: 'online' });
				emitEvent('presence', { ...message, status: 'online' });
				message.status = 'online';
				clearTimeout(timeOut);
				timeOut = createTimeOut();
			}
		};

		const removeBrowserEventListeners = () => {
			clearTimeout(timeOut);
			clearInterval(heartbeatInterval);
			removeEventListener('mousemove', handleTimerReset);
			removeEventListener('mousedown', handleTimerReset);
			removeEventListener('keypress', handleTimerReset);
			removeEventListener('scroll', handleTimerReset);
		};

		const addBrowserEventListeners = () => {
			addEventListener('mousemove', handleTimerReset);
			addEventListener('mousedown', handleTimerReset);
			addEventListener('keypress', handleTimerReset);
			addEventListener('scroll', handleTimerReset);
		};

		const handlePresence: WebSocketEventHandler<'presence'> = payload => {
			if (payload.userId !== user.id) return;

			message = payload;
			switch (payload.status) {
				case 'online':
					removeBrowserEventListeners();
					addBrowserEventListeners();
					createTimeOut();
					break;
				case 'offline':
					clearTimeout(timeOut);
					break;
			}

			heartbeatInterval = setInterval(() => {
				emitEvent('heartbeat', { userId: user.id, username: user.username, relationshipId });
			}, HEART_BEAT_INTERVAL);
		};

		const visibilityChangeHandler = async () => {
			if (!message) return;

			if (document.visibilityState === 'visible' && message.status === 'idle') {
				await handleTimerReset();
			}
		};

		addEventHandler('presence', handlePresence);
		addEventListener('visibilitychange', visibilityChangeHandler);

		return () => {
			removeEventHandler('presence', handlePresence);
			removeBrowserEventListeners();
			removeEventListener('visibilitychange', visibilityChangeHandler);
		};
	}, [addEventHandler, emitEvent, relationshipId, removeEventHandler, updateUser, user.id, user.username]);
};

type PresenceWatcherProps = {
	user: User;
	relationshipId: string;
};

export const PresenceWatcher: FC<PresenceWatcherProps> = ({ user, relationshipId }) => {
	usePresenceWatcher(user, relationshipId);
	return <></>;
};
