import { selectAffirmation, sendAffirmationToUser } from '@lumi/core/affirmations/affirmations.service';
import { getRelationshipById } from '@lumi/core/relationships/relationship.service';
import { User } from '@lumi/core/types/user.types';
import { WebSocketToken } from '@lumi/core/types/websockets.types';
import { getUserById } from '@lumi/core/users/users.service';
import { createAsyncWebsocketConnection } from '@lumi/core/websockets/websockets.service';
import { Handler, SQSEvent } from 'aws-lambda';
import { Resource } from 'sst';

export const handler: Handler<SQSEvent> = async event => {
	console.log('Processing affirmation notification event...');

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

		const partner1 = await getUserById(relationship.partner1);
		const partner2 = await getUserById(relationship.partner2);

		const handleNotifications = async (user: User) => {
			const affirmation = await selectAffirmation(user.id);
			if (!affirmation) {
				console.log(`No affirmation found for user ${user.id}`);
				return;
			}

			await sendAffirmationToUser(user, {
				affirmation: affirmation.affirmation,
				mqttClient: mqttConnection,
				partner: user.id === partner1?.id ? partner2 : partner1,
			});
		};

		if (partner1) await handleNotifications(partner1);
		if (partner2) await handleNotifications(partner2);

		mqttConnection.end();
		console.log('All done!');
	} catch (e) {
		console.error('There was an unhandled error!', e);
	}
};
