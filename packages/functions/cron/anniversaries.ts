import type { Relationship } from '@lumi/core/relationships/relationship.types';
import type { User } from '@lumi/core/users/user.types';
import type { APIGatewayProxyEventV2, Handler, SQSEvent } from 'aws-lambda';
import { SQS } from '@aws-sdk/client-sqs';
import { sendNotification } from '@lumi/core/notifications/notifications.service';
import { getAnniversaryRelationships } from '@lumi/core/relationships/relationship.service';
import { getUserById } from '@lumi/core/users/users.service';
import { createAsyncWebsocketConnection } from '@lumi/core/websockets/websockets.service';
import { WebSocketToken } from '@lumi/core/websockets/websockets.types';
import { Resource } from 'sst';

const queue = new SQS();

export const aggregator: Handler<APIGatewayProxyEventV2> = async () => {
	console.log('Checking for any anniversaries today...');
	const relationships = await getAnniversaryRelationships();

	console.log(`Queueing affirmation notifications for ${relationships.length} relationships...`);
	for (let i = 0; i < relationships.length; i++) {
		const relationship = relationships[i];
		await queue.sendMessage({
			QueueUrl: Resource.AnniversarySenderQueue.url,
			MessageBody: JSON.stringify(relationship),
		});
		console.log(`(${i + 1}/${relationships.length}) Enqueued anniversary notification for relationship with ID: ${relationship.id}!`);
	}
	console.log('All done!');
};

export const sender: Handler<SQSEvent> = async (event) => {
	console.log('Processing anniversary notification event...');

	const relationship = JSON.parse(event.Records[0].body) as Relationship;

	try {
		const mqttConnection = await createAsyncWebsocketConnection({
			endpoint: Resource.RealtimeServer.endpoint,
			authorizer: Resource.RealtimeServer.authorizer,
			token: WebSocketToken.GLOBAL,
		});

		console.log('Connected to websocket! Now sending out notifications');

		const partner1 = await getUserById(relationship.partner1);
		const partner2 = await getUserById(relationship.partner2);

		const handleNotifications = async (user: User) => {
			const partner = user.id === partner1?.id ? partner2 : partner1;
			if (!partner) {
				console.log(`No partner found for user ${user.id}`);
				return;
			}

			await sendNotification({
				user,
				payload: {
					title: 'Happy Anniversary!',
					body: `Today is your anniversary with ${partner.firstName}! Send them a really long lovey-dovey message today and show them all the love. 💘`,
				},
				opts: {
					onlineWebSocketMessage: {
						mqttConnection,
						topic: `${process.env.NOTIFICATIONS_TOPIC}/${user.id}/notifications`,
					},
				},
			});
		};

		if (partner1) await handleNotifications(partner1);
		if (partner2) await handleNotifications(partner2);

		mqttConnection.end();
		console.log('All done!');
	} catch (e: any) {
		console.error('There was an unhandled error!', e);
	}
};
