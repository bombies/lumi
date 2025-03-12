import { WebSocketSubTopic, WebSocketToken } from '@lumi/core/types/websockets.types';
import { realtime } from 'sst/aws/realtime';

export const handler = realtime.authorizer(async token => {
	// Validate the token
	const [identifier, id, extra] = token.split('::');

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
			throw new Error('Invalid identifier');
	}

	// Return the topics to subscribe and publish
	return {
		policyDocuments: [
			{
				Version: '2012-10-17',
				Statement: [
					{
						Action: 'iot:*',
						Effect: 'Allow',
						Resource: '*',
					},
				],
			},
		],
		...allowedSubscriptions,
	};
});
