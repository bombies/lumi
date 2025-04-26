import { User } from '@lumi/core/users/user.types';
import { dynamo, updateItem } from '@lumi/core/utils/dynamo/dynamo.service';
import { DynamoKey } from '@lumi/core/utils/dynamo/dynamo.types';
import { createAsyncWebsocketConnection, emitAsyncWebsocketEvent } from '@lumi/core/websockets/websockets.service';
import { DatabaseWebSocketHeartbeat, WebSocketSubTopic, WebSocketToken } from '@lumi/core/websockets/websockets.types';
import { APIGatewayProxyEvent, Handler } from 'aws-lambda';
import { ISubscriptionMap } from 'mqtt';
import { Resource } from 'sst';

const CONNECTION_TTL = 60 * 1000; // 1 minute

export const handler: Handler<APIGatewayProxyEvent> = async () => {
	console.log('Cleaning up expired websocket connections...');

	const latestHealthyTime = Date.now() - CONNECTION_TTL;

	const res = await dynamo.query({
		TableName: process.env.TABLE_NAME,
		KeyConditionExpression: '#pk = :pk',
		FilterExpression: '#timestamp < :timestamp',
		ExpressionAttributeNames: {
			'#pk': 'pk',
			'#timestamp': 'timestamp',
		},
		ExpressionAttributeValues: {
			':pk': DynamoKey.webSocketHeartbeat.pk(),
			':timestamp': latestHealthyTime,
		},
	});

	if (res.$metadata.httpStatusCode !== 200) {
		console.error('Failed to query expired connections');
		return;
	}
	

	const expiredConnections = (res.Items ?? []) as DatabaseWebSocketHeartbeat[];

	console.log(`Found ${expiredConnections.length} expired connections`);
	if (expiredConnections.length > 0) {
		// Bulk delete heartbeats
		const deleteRequests = expiredConnections.map(({ pk, sk }) => ({
			DeleteRequest: {
				Key: {
					pk,
					sk,
				},
			},
		}));

		await dynamo.batchWrite({
			RequestItems: {
				[process.env.TABLE_NAME!]: deleteRequests,
			},
		});

		// Update each user's status to offline
		const userIds = expiredConnections.map(({ payload }) => payload.userId);
		const updateRequests = userIds.map(userId =>
			updateItem<User>({
				pk: DynamoKey.user.pk(userId),
				sk: DynamoKey.user.sk(userId),
				update: { status: 'offline' },
			}),
		);

		await Promise.all(updateRequests);

		// Send a message to the relationship websocket topic to notify the other user.
		const mqttConnection = await createAsyncWebsocketConnection({
			endpoint: Resource.RealtimeServer.endpoint,
			authorizer: Resource.RealtimeServer.authorizer,
			token: WebSocketToken.GLOBAL,
		});

		try {
			console.log('Connected to websocket! Now sending out updates');

			const topicPrefix = `${process.env.NOTIFICATIONS_TOPIC!}/${WebSocketSubTopic.RELATIONSHIP}/`;
			await mqttConnection.subscribeAsync({
				...expiredConnections.reduce((acc, curr) => {
					acc[`${topicPrefix}${curr.payload.relationshipId}`] = { qos: 1 };
					return acc;
				}, {} as ISubscriptionMap),
			});

			for (const expiredConn of expiredConnections) {
				const {
					payload: { userId, relationshipId, username },
				} = expiredConn;

				try {
					console.log('Publishing offline message for relationship ', relationshipId);
					await emitAsyncWebsocketEvent({
						client: mqttConnection,
						topic: `${topicPrefix}${relationshipId}`,
						source: 'server',
						event: 'presence',
						payload: {
							userId,
							status: 'offline',
							username,
						},
					});
					console.log('Published offline message for relationship ', relationshipId);
				} catch (e) {
					console.error('Failed to publish offline message', e);
				}
			}
		} catch (e) {
			console.error('There was an unhandled error!', e);
		}

		mqttConnection.end();
	}
};
