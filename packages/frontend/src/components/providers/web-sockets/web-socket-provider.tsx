'use client';

import { createContext, FC, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { User } from '@lumi/core/types/user.types';
import {
	Event,
	events,
	InferredWebSocketMessage,
	WebSocketEventHandler,
	WebSocketMessage,
	WebSocketMessageMap,
	WebSocketSubTopic,
	WebSocketToken,
} from '@lumi/core/types/websockets.types';
import { MqttClientType } from '@lumi/core/websockets/websockets.service';

import { UpdateUser } from '@/app/(site)/(internal)/settings/(account)/trpc-hooks';
import { connectToWebsocket } from '@/lib/actions/web-socket-actions';
import { useQueue } from '@/lib/hooks/useQueue';
import { logger } from '@/lib/logger';

type WebSocketProviderProps = PropsWithChildren<{
	endpoint: string;
	authorizer: string;
	user: User;
	relationshipId?: string;
}>;

type WebSocketProviderData = {
	connectionStatus: 'connecting' | 'connected' | 'disconnected';
	mqttConnection: MqttClientType | null;
	addEventHandler: <T extends Event>(event: T, handler: WebSocketEventHandler<T>) => void;
	removeEventHandler: <T extends Event>(event: T, handler: WebSocketEventHandler<T>) => void;
	emitEvent: <T extends Event>(event: T, payload: InferredWebSocketMessage<T>['payload']) => void;
};

const WebSocketContext = createContext<WebSocketProviderData | undefined>(undefined);

export const useWebSocket = () => {
	const context = useContext(WebSocketContext);
	if (context === undefined) throw new Error('useWebSocket must be used within a WebSocketProvider');

	return context;
};

export const relationshipWSTopic = (relationshipId: string) =>
	`${process.env.NEXT_PUBLIC_NOTIFICATIONS_TOPIC!}/${WebSocketSubTopic.RELATIONSHIP}/${relationshipId}`;

const WebSocketProvider: FC<WebSocketProviderProps> = ({ children, user, endpoint, authorizer, relationshipId }) => {
	const { mutateAsync: updateUser } = UpdateUser();
	const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>(
		'disconnected',
	);
	const [mqttConnection, setMqttConnection] = useState<MqttClientType | null>(null);
	const [eventHandlers, setEventHandlers] = useState<Record<Event, WebSocketEventHandler<Event>[]>>(
		{} as Record<Event, WebSocketEventHandler<Event>[]>,
	);
	const { enqueue: enqueueEvent } = useQueue<InferredWebSocketMessage<Event>>({
		process: async message => {
			logger.debug('processing event', message);
			const handlers = eventHandlers[message.type];
			logger.debug('handlers', handlers);
			if ('payload' in message && handlers)
				handlers.forEach(async handler => {
					if (handler instanceof Promise)
						await handler(message.payload as InferredWebSocketMessage<Event>['payload']);
					else handler(message.payload as InferredWebSocketMessage<Event>['payload']);
				});
		},
	});

	const addEventHandler = useCallback(<T extends Event>(event: T, handler: WebSocketEventHandler<T>) => {
		setEventHandlers(prev => {
			const handlers = prev[event] || [];

			// Ensure the handler is not already in the list
			if (handlers.includes(handler)) return prev;

			handlers.push(handler);
			return { ...prev, [event]: handlers };
		});
	}, []);

	const removeEventHandler = useCallback(<T extends Event>(event: T, handler: WebSocketEventHandler<T>) => {
		setEventHandlers(prev => {
			const handlers = prev[event] || [];
			const index = handlers.indexOf(handler);
			if (index !== -1) handlers.splice(index, 1);
			return { ...prev, [event]: handlers };
		});
	}, []);

	const emitEvent = useCallback(
		<T extends Event>(event: T, payload: InferredWebSocketMessage<T>['payload']) => {
			if (mqttConnection && relationshipId) {
				const message = {
					type: event,
					payload,
					timestamp: Date.now(),
					source: 'client',
				} satisfies WebSocketMessage<T, typeof payload>;
				mqttConnection.publish(relationshipWSTopic(relationshipId), JSON.stringify(message));
			}
		},
		[mqttConnection, relationshipId],
	);

	useEffect(() => {
		(async () => {
			if (connectionStatus !== 'disconnected' || !relationshipId) return;
			setConnectionStatus('connecting');

			const mqttConnection = await connectToWebsocket({
				endpoint,
				authorizer,
				identifier: user.id,
				token: `${WebSocketToken.RELATIONSHIP_USER}::${relationshipId}`,
				onConnect: async connection => {
					await connection.subscribeAsync({
						[relationshipWSTopic(relationshipId)]: {
							qos: 1,
						},
					});

					await updateUser({ status: 'online' });

					logger.debug('connected, now emitting conect event');
					connection.publish(
						relationshipWSTopic(relationshipId),
						JSON.stringify({
							type: 'connect',
							payload: { userId: user.id, username: user.username },
							timestamp: Date.now(),
							source: 'client',
						} satisfies WebSocketMessageMap['connect']),
					);

					mqttConnection.publish(
						relationshipWSTopic(relationshipId),
						JSON.stringify({
							type: 'presence',
							payload: { userId: user.id, username: user.username, status: 'online' },
							timestamp: Date.now(),
							source: 'client',
						} satisfies WebSocketMessageMap['presence']),
					);

					setMqttConnection(connection);
					setConnectionStatus('connected');
				},
				onDisconnect: async () => {
					await updateUser({ status: 'offline' });
					emitEvent('disconnect', {
						userId: user.id,
						username: user.username,
					});
					setMqttConnection(null);
					setConnectionStatus('disconnected');
				},
				onMessage(message) {
					if (
						message &&
						typeof message === 'object' &&
						'type' in message &&
						typeof message.type === 'string' &&
						events.includes(message.type as Event)
					) {
						logger.debug('Callback handling messge', message);
						enqueueEvent(message as InferredWebSocketMessage<Event>);
					}
				},
			});

			setMqttConnection(mqttConnection);
		})();
	}, [
		authorizer,
		connectionStatus,
		emitEvent,
		endpoint,
		enqueueEvent,
		eventHandlers,
		mqttConnection,
		relationshipId,
		updateUser,
		user.id,
		user.username,
	]);

	// Disconnect handlers
	useEffect(() => {
		const handler = async () => {
			await updateUser({ status: 'offline' });

			mqttConnection?.publish(
				relationshipWSTopic(relationshipId!),
				JSON.stringify({
					type: 'presence',
					payload: { userId: user.id, username: user.username, status: 'offline' },
					timestamp: Date.now(),
					source: 'client',
				} satisfies WebSocketMessageMap['presence']),
			);

			mqttConnection?.publish(
				relationshipWSTopic(relationshipId!),
				JSON.stringify({
					type: 'disconnect',
					payload: { userId: user.id, username: user.username },
					timestamp: Date.now(),
					source: 'client',
				} satisfies WebSocketMessageMap['disconnect']),
			);
			mqttConnection?.end();
		};

		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	}, [emitEvent, mqttConnection, relationshipId, updateUser, user.id, user.username]);

	const memoizedValues = useMemo(
		() => ({
			mqttConnection,
			addEventHandler,
			removeEventHandler,
			emitEvent,
			connectionStatus,
		}),
		[addEventHandler, connectionStatus, emitEvent, mqttConnection, removeEventHandler],
	);

	return <WebSocketContext.Provider value={memoizedValues}>{children}</WebSocketContext.Provider>;
};

export default WebSocketProvider;
