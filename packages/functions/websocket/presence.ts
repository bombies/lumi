import { Event, InferredWebSocketMessage } from '@lumi/core/types/websockets.types';
import { updateUser } from '@lumi/core/users/users.service';
import { Handler } from 'aws-lambda';

export const subscriber: Handler<InferredWebSocketMessage<Event>> = async event => {
	if (event.type === 'presence') {
		const { payload } = event;
		await updateUser(payload.userId, {
			status: payload.status,
		});
	}
};
