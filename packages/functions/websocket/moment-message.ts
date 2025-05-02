import type { Event, InferredWebSocketMessage } from '@lumi/core/websockets/websockets.types';
import type { Handler } from 'aws-lambda';
import { createMomentMessage, updateMomentMessage } from '@lumi/core/moments/moment.service';

export const subscriber: Handler<InferredWebSocketMessage<Event>> = async (event) => {
	switch (event.type) {
		case 'momentChat':
			const { payload } = event;
			await createMomentMessage(payload.senderId, {
				id: payload.messageId,
				momentId: payload.momentId,
				content: payload.message,
				timestamp: payload.timestamp,
			});

			break;
		case 'momentMessageStateUpdate':
			const { payload: { messageId, state, content } } = event;
			await updateMomentMessage({
				messageId,
				state,
				content,
			});
			break;
		case 'momentMessageReact':
			const { payload: { messageId: msgId, reaction } } = event;
			await updateMomentMessage({
				messageId: msgId,
				reaction,
			});
			break;
	}
};
