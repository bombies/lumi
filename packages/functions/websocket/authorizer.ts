import { getRelationshipById } from '@lumi/core/relationships/relationship.service';
import { WebSocketSubTopic, WebSocketToken } from '@lumi/core/websockets/websockets.types';
import { realtime } from 'sst/aws/realtime';

export const handler = realtime.authorizer(async (token) => {
	// Validate the token
	const [client_id, identifier, args] = token.split('::');

	let allowedPaths: {
		subscribe: string[];
		publish: string[];
	};

	switch (identifier) {
		case WebSocketToken.RELATIONSHIP_USER:
			const allowedSubscriptionChannels = [
				`${process.env.NOTIFICATIONS_TOPIC!}/${WebSocketSubTopic.RELATIONSHIP}/${args}`,
				`${process.env.NOTIFICATIONS_TOPIC!}/${WebSocketSubTopic.RELATIONSHIP}/${args}/${WebSocketSubTopic.MOMENT_CHAT}/*`,
			];
			const allowedPublishingChannels = [
				`${process.env.NOTIFICATIONS_TOPIC!}/${WebSocketSubTopic.RELATIONSHIP}/${args}`,
				`${process.env.NOTIFICATIONS_TOPIC!}/${WebSocketSubTopic.RELATIONSHIP}/${args}/${WebSocketSubTopic.MOMENT_CHAT}/*`,
				`${process.env.NOTIFICATIONS_TOPIC!}/${WebSocketSubTopic.RELATIONSHIP}/${args}/${WebSocketSubTopic.HEARTBEAT}`,
			];

			if (client_id.startsWith('client_user')) {
				const userId = client_id.split(':')[1].split('_')[0];
				allowedSubscriptionChannels.push(`${process.env.NOTIFICATIONS_TOPIC!}/${userId}/notifications`);
				allowedPublishingChannels.push(`${process.env.NOTIFICATIONS_TOPIC!}/${userId}/notifications`);

				const relationship = await getRelationshipById(args);
				if (relationship) {
					const partnerId = relationship.partner1 === userId ? relationship.partner2 : relationship.partner1;
					allowedPublishingChannels.push(`${process.env.NOTIFICATIONS_TOPIC!}/${partnerId}/notifications`);
				}
			}

			allowedPaths = {
				subscribe: allowedSubscriptionChannels,
				publish: allowedPublishingChannels,
			};
			break;
		case WebSocketToken.GLOBAL:
			allowedPaths = {
				subscribe: [`${process.env.NOTIFICATIONS_TOPIC!}/*`],
				publish: [`${process.env.NOTIFICATIONS_TOPIC!}/*`],
			};
			break;
		default:
			allowedPaths = {
				subscribe: [],
				publish: [],
			};
	}

	console.log(`Authorizing ${token}`);

	// Return the topics to subscribe and publish
	return {
		...allowedPaths,
	};
});
