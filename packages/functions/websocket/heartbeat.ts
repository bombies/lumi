import { Event, InferredWebSocketMessage } from '@lumi/core/types/websockets.types';
import { storeWebsocketHeartbeat } from '@lumi/core/websockets/websockets.service';
import { Handler } from 'aws-lambda';

export const subscriber: Handler<InferredWebSocketMessage<Event>> = async event => {
	switch (event.type) {
		case 'heartbeat':
			await storeWebsocketHeartbeat(event.payload.userId, event.timestamp, event.payload);
			break;
		default:
			return;
	}
};
