'use client';

import { FC, useEffect } from 'react';

import { WebSocketEventHandler, WebSocketMessageMap } from '@/components/providers/web-sockets/web-socket-messages';
import { useWebSocket } from '@/components/providers/web-sockets/web-socket-provider';

const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes

export const usePresenceWatcher = (userId: string) => {
	const { emitEvent, addEventHandler, removeEventHandler } = useWebSocket();

	useEffect(() => {
		let timeOut: NodeJS.Timeout | undefined;
		let message: WebSocketMessageMap['presence']['payload'] | undefined;

		const createTimeOut = () => {
			return setTimeout(() => {
				if (message) emitEvent('presence', { ...message, status: 'idle' });
			}, IDLE_TIMEOUT);
		};

		const handleTimerReset = () => {
			if (message && message.status === 'idle') {
				emitEvent('presence', { ...message, status: 'online' });
				message.status = 'online';
				clearTimeout(timeOut);
				timeOut = createTimeOut();
			}
		};

		const removeBrowserEventListeners = () => {
			clearTimeout(timeOut);
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
			if (payload.userId !== userId) return;

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
		};

		addEventHandler('presence', handlePresence);

		return () => {
			removeEventHandler('presence', handlePresence);
			removeBrowserEventListeners();
		};
	}, [addEventHandler, emitEvent, removeEventHandler, userId]);
};

type PresenceWatcherProps = {
	userId: string;
};

export const PresenceWatcher: FC<PresenceWatcherProps> = ({ userId }) => {
	usePresenceWatcher(userId);
	return <></>;
};
