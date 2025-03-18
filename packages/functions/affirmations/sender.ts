import { createReceivedAffirmation, selectAffirmation } from '@lumi/core/affirmations/affirmations.service';
import { getNotificationSubscriptions } from '@lumi/core/notifications/notifications.service';
import { getRelationshipById } from '@lumi/core/relationships/relationship.service';
import { Relationship } from '@lumi/core/types/relationship.types';
import { User } from '@lumi/core/types/user.types';
import {
	InferredWebSocketMessagePayload,
	WebSocketMessageMap,
	WebSocketToken,
} from '@lumi/core/types/websockets.types';
import { getUserById } from '@lumi/core/users/users.service';
import {
	createAsyncWebsocketConnection,
	createWebsocketConnection,
	emitAsyncWebsocketEvent,
} from '@lumi/core/websockets/websockets.service';
import { Handler, SQSEvent } from 'aws-lambda';
import { Resource } from 'sst';
import webpush from 'web-push';

export const handler: Handler<SQSEvent> = async event => {
	console.log('Processing affirmation notification event...');

	const receipt = event.Records[0].receiptHandle;
	const relationshipId = JSON.parse(event.Records[0].body) as string;
	const relationship = await getRelationshipById(relationshipId);
	if (!relationship) throw new Error(`Relationship ${relationshipId} not found`);

	// Setup the websocket connection
	try {
		const mqttConnection = await createAsyncWebsocketConnection({
			endpoint: Resource.RealtimeServer.endpoint,
			authorizer: Resource.RealtimeServer.authorizer,
			token: WebSocketToken.GLOBAL,
		});

		console.log('Connected to websocket! Now sending out notifications');

		const topicPrefix = `${process.env.NOTIFICATIONS_TOPIC}/`;

		await mqttConnection.subscribeAsync({
			[`${topicPrefix}${relationship.partner1}`]: {
				qos: 1,
			},
			[`${topicPrefix}${relationship.partner2}`]: {
				qos: 1,
			},
		});

		const partner1 = await getUserById(relationship.partner1);
		const partner2 = await getUserById(relationship.partner2);

		const handleNotifications = async (user: User) => {
			const affirmation = await selectAffirmation(user.id);
			if (!affirmation) {
				console.log(`No affirmation found for user ${user.id}`);
				return;
			}
			try {
				if (user.status === 'offline') {
					console.log(`${user.username} is offline... Sending notification through webpush`);
					const notificationSubs = await getNotificationSubscriptions(user.id);
					for (const sub of notificationSubs) {
						webpush.setVapidDetails(
							'mailto:contact@ajani.me',
							Resource.VapidPublicKey.value,
							Resource.VapidPrivateKey.value,
						);

						await webpush.sendNotification(
							sub,
							JSON.stringify({
								title: `${(user.id === partner1?.id ? partner1.firstName : partner2?.firstName) ?? 'Your partner'} says`,
								body: affirmation.affirmation,
								icon: '/favicon-96x96.png',
							}),
						);
					}
				} else {
					console.log(`${user.username} is either online or idle... Sending notification through websocket`);
					await emitAsyncWebsocketEvent({
						client: mqttConnection,
						topic: `${topicPrefix}${user.id}`,
						event: 'notification',
						payload: {
							from: {
								type: 'system',
							},
							message: {
								title: `${(user.id === partner1?.id ? partner1.firstName : partner2?.firstName) ?? 'Your partner'} says`,
								content: affirmation.affirmation,
							},
						},
						source: 'server',
					});
				}

				console.log(`Sent notifications to ${user.id}`);
				await createReceivedAffirmation(user.id, relationship.id, affirmation.affirmation);
			} catch (e) {
				console.error(`Could not send notification to ${user.username}`, e);
			}
		};

		if (partner1) await handleNotifications(partner1);
		if (partner2) await handleNotifications(partner2);

		mqttConnection.end();
		console.log('All done!');
	} catch (e) {
		console.error('There was an unhandled error!', e);
	}
};
