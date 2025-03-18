'use server';

import {
	Event,
	InferredWebSocketMessagePayload,
	WebSocketMessage,
	WebSocketToken,
} from '@lumi/core/types/websockets.types';
import { createWebsocketConnection } from '@lumi/core/websockets/websockets.service';
import { Resource } from 'sst';

import { logger } from '@/lib/logger';

export const sendServerWebsocketMessage = async <T extends Event>(
	event: T,
	topic: string,
	payload: InferredWebSocketMessagePayload<T>,
) => {
	// Send a message from the server with a clean connection.
	const { client: mqttConnection } = createWebsocketConnection({
		endpoint: Resource.RealtimeServer.endpoint,
		authorizer: Resource.RealtimeServer.authorizer,
		token: WebSocketToken.GLOBAL,
		reschedulePings: false,
	});

	logger.debug('Sending server websocket message.', topic, payload);
	mqttConnection.on('connect', async () => {
		logger.debug('Connected to MQTT broker');
		await mqttConnection.subscribeAsync({
			[topic]: {
				qos: 1,
			},
		});
		logger.debug('Subscribed to topic', topic);

		await mqttConnection.publishAsync(
			topic,
			JSON.stringify({
				type: event,
				payload,
				timestamp: Date.now(),
				source: 'server',
			} satisfies WebSocketMessage<T>),
		);
		logger.debug('Published message');
	});

	mqttConnection.connect();
};
