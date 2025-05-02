import type { Event, InferredWebSocketMessage } from '@lumi/core/websockets/websockets.types';
import type { Handler } from 'aws-lambda';
import { storeWebsocketHeartbeat } from '@lumi/core/websockets/websockets.service';

export const subscriber: Handler<InferredWebSocketMessage<Event>> = async (event) => {
	if (event.type === 'heartbeat') {
		console.log(`Received a heartbeat from ${event.payload.userId} (${new Date(event.timestamp).toISOString()})`);
		await storeWebsocketHeartbeat(event.payload.userId, event.timestamp, event.payload);
	}
};
