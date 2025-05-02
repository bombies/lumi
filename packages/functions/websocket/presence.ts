import type { Event, InferredWebSocketMessage } from '@lumi/core/websockets/websockets.types';
import type { Handler } from 'aws-lambda';
import { updateUser } from '@lumi/core/users/users.service';

export const subscriber: Handler<InferredWebSocketMessage<Event>> = async (event) => {
	if (event.type === 'presence') {
		const { payload } = event;
		await updateUser(payload.userId, {
			status: payload.status,
		});
	}
};
