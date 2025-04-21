import { createMomentMessage } from '@lumi/core/moments/moment.service';
import { Event, InferredWebSocketMessage } from '@lumi/core/websockets/websockets.types';
import { Handler } from 'aws-lambda';

export const subscriber: Handler<InferredWebSocketMessage<Event>> = async event => {
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
