'use client';

import type { User } from '@lumi/core/users/user.types';
import type { MqttClientType } from '@lumi/core/websockets/websockets.service';
import type {
	Event,
	InferredWebSocketMessage,
	WebSocketEventHandler,
} from '@lumi/core/websockets/websockets.types';
import type { FC, PropsWithChildren } from 'react';
import { emitAsyncWebsocketEvent } from '@lumi/core/websockets/websockets.service';
import {
	events,
	WebSocketToken,
} from '@lumi/core/websockets/websockets.types';
import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';

import { connectToWebsocket } from '@/components/providers/web-sockets/web-socket-actions';
import { UpdateUser } from '@/hooks/trpc/user-hooks';
import { useQueue } from '@/lib/hooks/useQueue';
import { logger } from '@/lib/logger';
import { WebsocketTopic } from './topics';

type WebSocketProviderProps = PropsWithChildren<{
	endpoint: string;
	authorizer: string;
	user: User;
	relationshipId: string;
}>;

type WebSocketProviderData = {
	connectionStatus: 'connecting' | 'connected' | 'disconnected';
	mqttConnection: MqttClientType | null;
	addEventHandler: <T extends Event>(event: T, handler: WebSocketEventHandler<T>) => void;
	removeEventHandler: <T extends Event>(event: T, handler: WebSocketEventHandler<T>) => void;
	subscribeToTopic: (topic: string) => Promise<void | undefined>;
	emitEvent: <T extends Event>(
		event: T,
		payload: InferredWebSocketMessage<T>['payload'],
		args?: {
			topic?: string;
		},
	) => Promise<void>;
};

const WebSocketContext = createContext<WebSocketProviderData | undefined>(undefined);

export const useWebSocket = () => {
	const context = use(WebSocketContext);
	if (context === undefined) throw new Error('useWebSocket must be used within a WebSocketProvider');

	return context;
};

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
		process: async (message) => {
			logger.debug('processing event', message);
			const handlers = eventHandlers[message.type];
			logger.debug('handlers', handlers);
			if ('payload' in message && handlers)
				handlers.forEach(async (handler) => {
					const cb = handler(message.payload as InferredWebSocketMessage<Event>['payload']);
					if (cb instanceof Promise) await cb;
				});
		},
	});
	const { enqueue: enqueuePostConnectionAction, startProcessing: processPostConnectionActions } = useQueue<
		() => any | Promise<any>
	>({
				process: async (fn) => {
					await fn();
				},
				lazyProcess: true,
			});

	const addEventHandler = useCallback(<T extends Event>(event: T, handler: WebSocketEventHandler<T>) => {
		setEventHandlers((prev) => {
			const handlers = prev[event] || [];

			// Ensure the handler is not already in the list
			if (handlers.includes(handler)) return prev;

			handlers.push(handler);
			return { ...prev, [event]: handlers };
		});
	}, []);

	const removeEventHandler = useCallback(<T extends Event>(event: T, handler: WebSocketEventHandler<T>) => {
		setEventHandlers((prev) => {
			const handlers = prev[event] || [];
			const index = handlers.indexOf(handler);
			if (index !== -1) handlers.splice(index, 1);
			return { ...prev, [event]: handlers };
		});
	}, []);

	const emitEvent = useCallback(
		async <T extends Event>(
			event: T,
			payload: InferredWebSocketMessage<T>['payload'],
			args?: {
				topic?: string;
			},
		) => {
			if (mqttConnection) {
				await emitAsyncWebsocketEvent({
					client: mqttConnection,
					topic: args?.topic ?? WebsocketTopic.relationshipWSTopic(relationshipId),
					event,
					payload,
					source: 'client',
				});
			}
		},
		[mqttConnection, relationshipId],
	);

	const subscribeToTopic = useCallback(
		async (topic: string) => {
			enqueuePostConnectionAction(() => mqttConnection?.subscribeAsync({ [topic]: { qos: 1 } }));
		},
		[mqttConnection],
	);

	useEffect(() => {
		logger.debug('CREATING A NEW CONNECTION.');
		setConnectionStatus('connecting');
		const connection = connectToWebsocket({
			endpoint,
			authorizer,
			identifier: `user:${user.id}`,
			token: `${WebSocketToken.RELATIONSHIP_USER}::${relationshipId}`,
			keepalive: 600,
			async onConnect(_, clientId) {
				try {
					logger.debug(`Connected to websocket! Attempting to subscribe to topic... (${clientId})`);
					await connection.subscribeAsync({
						[WebsocketTopic.relationshipWSTopic(relationshipId!)]: {
							qos: 1,
						},
						[WebsocketTopic.userNotificationsTopic(user.id)]: {
							qos: 1,
						},
					});
					logger.debug(`Successfully subscribed to topic! (${clientId})`);
					logger.debug(`Now sending status updates... (${clientId})`);
					await updateUser({ status: 'online' });
					await emitAsyncWebsocketEvent({
						client: connection,
						topic: WebsocketTopic.relationshipWSTopic(relationshipId),
						event: 'connect',
						payload: { userId: user.id, username: user.username },
						source: 'client',
					});

					await emitAsyncWebsocketEvent({
						client: connection,
						topic: WebsocketTopic.relationshipWSTopic(relationshipId),
						event: 'presence',
						payload: { userId: user.id, username: user.username, status: 'online' },
						source: 'client',
					});
					setMqttConnection(connection);
					setConnectionStatus('connected');

					processPostConnectionActions();
				} catch (e) {
					logger.error('Something went wrong while connecting to the websocket', e);
				}
			},
			async onMessage(message, clientId) {
				if (
					message
					&& typeof message === 'object'
					&& 'type' in message
					&& typeof message.type === 'string'
					&& events.includes(message.type as Event)
				) {
					logger.debug(`Callback handling messge (${clientId})`, message);
					enqueueEvent(message as InferredWebSocketMessage<Event>);
				}
			},
			async onDisconnect(clientId) {
				logger.debug(`Handling disconnect for ${clientId}`);
				await updateUser({ status: 'offline' });
				await emitAsyncWebsocketEvent({
					client: connection,
					topic: WebsocketTopic.relationshipWSTopic(relationshipId),
					event: 'disconnect',
					payload: { userId: user.id, username: user.username },
				});
				await emitAsyncWebsocketEvent({
					client: connection,
					topic: WebsocketTopic.relationshipWSTopic(relationshipId),
					event: 'presence',
					payload: { userId: user.id, username: user.username, status: 'offline' },
				});
				setMqttConnection(null);
				setConnectionStatus('disconnected');
			},
		});

		return () => {
			connection.end();
			setMqttConnection(null);
			setConnectionStatus('disconnected');
		};
	}, [
		authorizer,
		endpoint,
		enqueueEvent,
		processPostConnectionActions,
		relationshipId,
		updateUser,
		user.id,
		user.username,
	]);

	const memoizedValues = useMemo(
		() => ({
			mqttConnection,
			addEventHandler,
			removeEventHandler,
			emitEvent,
			subscribeToTopic,
			connectionStatus,
		}),
		[addEventHandler, connectionStatus, emitEvent, mqttConnection, removeEventHandler, subscribeToTopic],
	);

	return <WebSocketContext value={memoizedValues}>{children}</WebSocketContext>;
};

export default WebSocketProvider;
