import { WebSocketSubTopic, WebSocketToken } from '@lumi/core/types/websockets.types';
import { realtime } from 'sst/aws/realtime';

export const handler = realtime.authorizer(async token => {
	// Validate the token
	const [client_id, identifier, id] = token.split('::');

	let allowedSubscriptions: {
		subscribe: string[];
		publish: string[];
	};

	switch (identifier) {
		case WebSocketToken.RELATIONSHIP_USER:
			allowedSubscriptions = {
				subscribe: [`${process.env.NOTIFICATIONS_TOPIC!}/${WebSocketSubTopic.RELATIONSHIP}/${id}`],
				publish: [`${process.env.NOTIFICATIONS_TOPIC!}/${WebSocketSubTopic.RELATIONSHIP}/${id}`],
			};
			break;
		case WebSocketToken.GLOBAL:
			allowedSubscriptions = {
				subscribe: [process.env.NOTIFICATIONS_TOPIC! + '/*'],
				publish: [process.env.NOTIFICATIONS_TOPIC! + '/*'],
			};
			break;
		default:
			allowedSubscriptions = {
				subscribe: [],
				publish: [],
			};
	}

	// Return the topics to subscribe and publish
	return {
		...allowedSubscriptions,
	};
});
