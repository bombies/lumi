'use client';

import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Relationship } from '@lumi/core/types/relationship.types';
import { User } from '@lumi/core/types/user.types';
import { InferredWebSocketMessage, WebSocketEventHandler } from '@lumi/core/types/websockets.types';

import { useWebSocket } from '@/components/providers/web-sockets/web-socket-provider';
import { UpdateUser } from '@/hooks/trpc/user-hooks';
import { logger } from '@/lib/logger';

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const HEART_BEAT_INTERVAL = 60 * 1000; // 1 minute

type PresenceState = InferredWebSocketMessage<'presence'>['payload']['status'];

export const usePresenceWatcher = (user: User, relationship: Relationship) => {
	const { emitEvent, addEventHandler, removeEventHandler } = useWebSocket();
	const { mutateAsync: updateUser } = UpdateUser();
	const [presence, setPresence] = useState<PresenceState>('offline');
	const timerRef = useRef<number | null>(null);
	const heartbeatIntervalRef = useRef<number | null>(null);
	const presenceRef = useRef<PresenceState>(presence);
	const messageRef = useRef<InferredWebSocketMessage<'presence'>['payload'] | null>(null);
	const userAcitivtyBuffer = useRef<number | null>(null);

	useEffect(() => {
		presenceRef.current = presence;
	}, [presence]);

	const clearTimer = useCallback(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
	}, []);

	const startTimer = useCallback(async () => {
		if (messageRef.current?.status === 'idle') await updateUser({ status: 'online' });

		clearTimer();
		timerRef.current = window.setTimeout(async () => {
			if (messageRef.current) {
				await emitEvent('presence', { ...messageRef.current, status: 'idle' });
				await updateUser({ status: 'idle' });
				setPresence('idle');
			}
		}, IDLE_TIMEOUT);
		logger.debug('Started a new idle timer');
	}, [clearTimer, emitEvent, updateUser]);

	const startHeartbeatTimeout = useCallback(() => {
		if (heartbeatIntervalRef.current) return;
		heartbeatIntervalRef.current = window.setInterval(async () => {
			await emitEvent('heartbeat', {
				userId: user.id,
				username: user.username,
				relationshipId: relationship.id,
			});
		}, HEART_BEAT_INTERVAL);
		logger.debug('Started client websocket heartbeat interval');

		return () => {
			if (heartbeatIntervalRef.current) {
				clearInterval(heartbeatIntervalRef.current);
				heartbeatIntervalRef.current = null;
			}
		};
	}, [emitEvent, relationship.id, user.id, user.username]);

	const notifyOnline = useCallback(async () => {
		await emitEvent('presence', {
			userId: user.id,
			username: user.username,
			status: 'online',
		});
	}, [emitEvent, user.id, user.username]);

	const handleUserActivity = useCallback(async () => {
		if (userAcitivtyBuffer.current) return;

		userAcitivtyBuffer.current = window.setTimeout(async () => {
			if (presenceRef.current === 'online') {
				await startTimer();
			} else if (presenceRef.current === 'idle') {
				setPresence('online');
				await notifyOnline();
			}
			userAcitivtyBuffer.current = null;
		}, 500);
	}, [notifyOnline, startTimer]);

	const handlePageVisibilityEvents = useCallback(async () => {
		if (document.visibilityState === 'visible') {
			handleUserActivity();
		} else if (messageRef.current) {
			await emitEvent('presence', { ...messageRef.current, status: 'idle' });
			await updateUser({ status: 'idle' });
			setPresence('idle');
			clearTimer();
		}
	}, [clearTimer, emitEvent, handleUserActivity, updateUser]);

	useEffect(() => {
		const handlePresence: WebSocketEventHandler<'presence'> = async payload => {
			if (payload.userId === user.id) {
				switch (payload.status) {
					case 'online':
						setPresence('online');
						await startTimer();
						startHeartbeatTimeout();
						break;
					case 'offline':
						setPresence('offline');
						clearTimer();
						break;
					case 'idle':
						setPresence('idle');
						clearTimer();
						break;
				}
				messageRef.current = payload;
			}
		};

		const handleDisconnect: WebSocketEventHandler<'disconnect'> = () => {
			setPresence('offline');
			clearTimer();
		};

		addEventHandler('presence', handlePresence);
		addEventHandler('disconnect', handleDisconnect);

		return () => {
			removeEventHandler('presence', handlePresence);
			removeEventHandler('disconnect', handleDisconnect);
		};
	}, [
		addEventHandler,
		clearTimer,
		relationship.partner1,
		relationship.partner2,
		removeEventHandler,
		startHeartbeatTimeout,
		startTimer,
		updateUser,
		user.id,
	]);

	useEffect(() => {
		const livenessEvents: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keypress', 'scroll'];

		livenessEvents.forEach(event => window.addEventListener(event, handleUserActivity));
		window.addEventListener('visibilitychange', handlePageVisibilityEvents);

		return () => {
			livenessEvents.forEach(event => window.removeEventListener(event, handleUserActivity));
			window.removeEventListener('visibilitychange', handlePageVisibilityEvents);
		};
	}, [handlePageVisibilityEvents, handleUserActivity]);
};
type PresenceWatcherProps = {
	user: User;
	relationship: Relationship;
};

export const PresenceWatcher: FC<PresenceWatcherProps> = ({ user, relationship }) => {
	usePresenceWatcher(user, relationship);
	return <></>;
};
