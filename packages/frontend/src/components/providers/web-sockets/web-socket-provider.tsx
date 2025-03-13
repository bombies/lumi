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
import { connectToWebsocket } from '@/components/providers/web-sockets/web-socket-actions';
import { useQueue } from '@/lib/hooks/useQueue';
import { logger } from '@/lib/logger';

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
	emitEvent: <T extends Event>(
		event: T,
		payload: InferredWebSocketMessage<T>['payload'],
		args?: {
			topic?: string;
		},
	) => void;
};

const WebSocketContext = createContext<WebSocketProviderData | undefined>(undefined);

export const useWebSocket = () => {
	const context = useContext(WebSocketContext);
	if (context === undefined) throw new Error('useWebSocket must be used within a WebSocketProvider');

	return context;
};

export const relationshipWSTopic = (relationshipId: string) =>
	`${process.env.NEXT_PUBLIC_NOTIFICATIONS_TOPIC!}/${WebSocketSubTopic.RELATIONSHIP}/${relationshipId}`;

export const userNotificationsTopic = (userId: string) => `${process.env.NEXT_PUBLIC_NOTIFICATIONS_TOPIC!}/${userId}`;

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
		<T extends Event>(
			event: T,
			payload: InferredWebSocketMessage<T>['payload'],
			args?: {
				topic?: string;
			},
		) => {
			if (mqttConnection) {
				const message = {
					type: event,
					payload,
					timestamp: Date.now(),
					source: 'client',
				} satisfies WebSocketMessage<T, typeof payload>;
				mqttConnection.publish(args?.topic ?? relationshipWSTopic(relationshipId), JSON.stringify(message));
			}
		},
		[mqttConnection, relationshipId],
	);

	useEffect(() => {
		setConnectionStatus('connecting');
		const connection = connectToWebsocket({
			endpoint,
			authorizer,
			identifier: 'user:' + user.id,
			token: `${WebSocketToken.RELATIONSHIP_USER}::${relationshipId}`,
			async onConnect(_, clientId) {
				try {
					logger.debug(`Connected to websocket! Attempting to subscribe to topic... (${clientId})`);
					await connection.subscribeAsync({
						[relationshipWSTopic(relationshipId!)]: {
							qos: 1,
						},
						[userNotificationsTopic(user.id)]: {
							qos: 1,
						},
					});
					logger.debug(`Successfully subscribed to topic! (${clientId})`);
					logger.debug(`Now sending status updates... (${clientId})`);
					await updateUser({ status: 'online' });
					await connection.publishAsync(
						relationshipWSTopic(relationshipId),
						JSON.stringify({
							type: 'connect',
							payload: { userId: user.id, username: user.username },
							timestamp: Date.now(),
							source: 'client',
						} satisfies WebSocketMessageMap['connect']),
					);

					await connection.publishAsync(
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
				} catch (e) {
					logger.error('Something went wrong while connecting to the websocket', e);
				}
			},
			async onMessage(message, clientId) {
				if (
					message &&
					typeof message === 'object' &&
					'type' in message &&
					typeof message.type === 'string' &&
					events.includes(message.type as Event)
				) {
					logger.debug(`Callback handling messge (${clientId})`, message);
					enqueueEvent(message as InferredWebSocketMessage<Event>);
				}
			},
			async onDisconnect(clientId) {
				logger.debug(`Handling disconnect for ${clientId}`);
				await updateUser({ status: 'offline' });
				await connection.publishAsync(
					relationshipWSTopic(relationshipId),
					JSON.stringify({
						type: 'disconnect',
						payload: { userId: user.id, username: user.username },
						timestamp: Date.now(),
						source: 'client',
					} satisfies WebSocketMessageMap['disconnect']),
				);
				await connection.publishAsync(
					relationshipWSTopic(relationshipId),
					JSON.stringify({
						type: 'presence',
						payload: { userId: user.id, username: user.username, status: 'offline' },
						timestamp: Date.now(),
						source: 'client',
					} satisfies WebSocketMessageMap['presence']),
				);
				setMqttConnection(null);
				setConnectionStatus('disconnected');
			},
		});

		return () => {
			connection.end();
			setMqttConnection(null);
			setConnectionStatus('disconnected');
		};
	}, [authorizer, endpoint, enqueueEvent, relationshipId, updateUser, user.id, user.username]);

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
