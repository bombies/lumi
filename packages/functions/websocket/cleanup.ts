import { KeyPrefix } from '@lumi/core/types/dynamo.types';
import { User } from '@lumi/core/types/user.types';
import {
	DatabaseWebSocketHeartbeat,
	InferredWebSocketMessage,
	WebSocketMessageMap,
	WebSocketSubTopic,
	WebSocketToken,
} from '@lumi/core/types/websockets.types';
import { dynamo, getDynamicUpdateStatements } from '@lumi/core/utils/dynamo/dynamo.service';
import { createWebsocketConnection, emitWebsocketEvent } from '@lumi/core/websockets/websockets.service';
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
			':pk': KeyPrefix.WEBSOCKET_HEARTBEAT,
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
		const updateRequests = userIds.map(userId => {
			const { updateStatements, expressionAttributeNames, expressionAttributeValues } =
				getDynamicUpdateStatements<User>({ status: 'offline' });

			return dynamo.update({
				TableName: process.env.TABLE_NAME,
				Key: {
					pk: `${KeyPrefix.USER}${userId}`,
					sk: `${KeyPrefix.USER}${userId}`,
				},
				UpdateExpression: updateStatements,
				ExpressionAttributeNames: expressionAttributeNames,
				ExpressionAttributeValues: expressionAttributeValues,
			});
		});

		await Promise.all(updateRequests);

		// Send a message to the relationship websocket topic to notify the other user.
		const { client: mqttConnection } = createWebsocketConnection(
			Resource.RealtimeServer.endpoint,
			Resource.RealtimeServer.authorizer,
			`${WebSocketToken.GLOBAL}`,
		);

		mqttConnection.on('connect', async () => {
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
					await emitWebsocketEvent({
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
		});

		mqttConnection.connect();
	}
};
