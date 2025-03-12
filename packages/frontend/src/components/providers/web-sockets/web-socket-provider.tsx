'use client';

import { createContext, FC, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { WebSocketSubTopic, WebSocketToken } from '@lumi/core/types/websockets.types';
import { mqtt } from 'aws-iot-device-sdk-v2';

import {
	Event,
	events,
	InferredWebSocketMessage,
	WebSocketEventHandler,
} from '@/components/providers/web-sockets/web-socket-messages';
import { connectToWebsocket } from '@/lib/actions/web-socket-actions';

type WebSocketProviderProps = PropsWithChildren<{
	endpoint: string;
	authorizer: string;
	relationshipId?: string;
}>;

type WebSocketProviderData = {
	isConnected: boolean;
	mqttConnection: mqtt.MqttClientConnection | null;
	addEventHandler: <T extends Event>(event: T, handler: WebSocketEventHandler<T>) => void;
	removeEventHandler: <T extends Event>(event: T, handler: WebSocketEventHandler<T>) => void;
	emitEvent: <T extends Event>(topic: string, event: T, payload: InferredWebSocketMessage<T>['payload']) => void;
};

const WebSocketContext = createContext<WebSocketProviderData | undefined>(undefined);

export const useWebSocket = () => {
	const context = useContext(WebSocketContext);
	if (context === undefined) throw new Error('useWebSocket must be used within a WebSocketProvider');

	return context;
};

const WebSocketProvider: FC<WebSocketProviderProps> = ({ children, endpoint, authorizer, relationshipId }) => {
	const [isConnected, setIsConnected] = useState(false);
	const [mqttConnection, setMqttConnection] = useState<mqtt.MqttClientConnection | null>(null);
	const [eventHandlers, setEventHandlers] = useState<Record<Event, WebSocketEventHandler<Event>[]>>(
		{} as Record<Event, WebSocketEventHandler<Event>[]>,
	);

	useEffect(() => {
		(async () => {
			if (isConnected || !relationshipId) return;

			const mqttConnection = await connectToWebsocket({
				endpoint,
				authorizer,
				token: `${WebSocketToken.RELATIONSHIP_USER}::${relationshipId}`,
				onConnect: async connection => {
					console.log('Connected to WebSocket');
					await connection.subscribe(
						`${process.env.NEXT_PUBLIC_NOTIFICATIONS_TOPIC!}/${WebSocketSubTopic.RELATIONSHIP}/${relationshipId}`,
						mqtt.QoS.AtLeastOnce,
					);
					setMqttConnection(connection);
					setIsConnected(true);
				},
				onDisconnect: () => {
					setIsConnected(false);
				},
				onMessage(message) {
					if (
						message &&
						typeof message === 'object' &&
						'type' in message &&
						typeof message.type === 'string' &&
						events.includes(message.type as Event)
					) {
						const handlers = eventHandlers[message.type as Event];
						if ('payload' in message && handlers)
							handlers.forEach(async handler => {
								if (handler instanceof Promise)
									await handler(message.payload as InferredWebSocketMessage<Event>['payload']);
								else handler(message.payload as InferredWebSocketMessage<Event>['payload']);
							});
					}
				},
			});

			setMqttConnection(mqttConnection);
		})();
	}, [authorizer, endpoint, eventHandlers, isConnected]);

	const addEventHandler = useCallback(<T extends Event>(event: T, handler: WebSocketEventHandler<T>) => {
		setEventHandlers(prev => {
			const handlers = prev[event] || [];
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
		<T extends Event>(topic: string, event: T, payload: InferredWebSocketMessage<T>['payload']) => {
			if (mqttConnection) {
				mqttConnection.publish(topic, JSON.stringify({ type: event, payload }), mqtt.QoS.AtLeastOnce);
			}
		},
		[mqttConnection],
	);

	const memoizedValues = useMemo(
		() => ({
			isConnected,
			mqttConnection,
			addEventHandler,
			removeEventHandler,
			emitEvent,
		}),
		[addEventHandler, emitEvent, isConnected, mqttConnection, removeEventHandler],
	);

	return <WebSocketContext.Provider value={memoizedValues}>{children}</WebSocketContext.Provider>;
};

export default WebSocketProvider;
