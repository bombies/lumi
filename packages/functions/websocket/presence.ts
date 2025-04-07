import { updateUser } from '@lumi/core/users/users.service';
import { Event, InferredWebSocketMessage } from '@lumi/core/websockets/websockets.types';
import { Handler } from 'aws-lambda';

export const subscriber: Handler<InferredWebSocketMessage<Event>> = async event => {
	if (event.type === 'presence') {
		const { payload } = event;
		await updateUser(payload.userId, {
			status: payload.status,
		});
	}
};
