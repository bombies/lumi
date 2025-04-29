import type { Event, InferredWebSocketMessage } from '@lumi/core/websockets/websockets.types';
import type { Handler } from 'aws-lambda';
import { createMomentMessage } from '@lumi/core/moments/moment.service';

export const subscriber: Handler<InferredWebSocketMessage<Event>> = async (event) => {
	if (event.type === 'momentChat') {
		const { payload } = event;
		await createMomentMessage(payload.senderId, {
			id: payload.messageId,
			momentId: payload.momentId,
			content: payload.message,
			timestamp: payload.timestamp,
		});
	}
};
