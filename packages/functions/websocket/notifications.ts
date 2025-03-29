import { sendNotification } from '@lumi/core/notifications/notifications.service';
import { Event, InferredWebSocketMessage, WebSocketToken } from '@lumi/core/types/websockets.types';
import { getUserById } from '@lumi/core/users/users.service';
import { Handler } from 'aws-lambda';

export const subscriber: Handler<InferredWebSocketMessage<Event>> = async event => {
	if (event.source !== 'client') return;

	if (event.type === 'notification') {
		const { payload } = event;

		try {
			const user = await getUserById(payload.receiverId);
			if (!user) {
				console.error(`User ${payload.receiverId} not found`);
				return;
			}

			console.log('Received a notification message for a user, now attempting to send it out through webpush...');
			await sendNotification({
				user,
				payload: {
					title: payload.message.title,
					body: payload.message.content,
					openUrl: payload.openUrl,
				},
			});

			console.log('All done!');
		} catch (e) {
			console.error('There was an unhandled error!', e);
		}
	}
};
