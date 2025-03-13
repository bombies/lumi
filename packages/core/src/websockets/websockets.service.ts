import { createId } from '@paralleldrive/cuid2';
import { TRPCError } from '@trpc/server';
import mqtt from 'mqtt';

import { EntityType, KeyPrefix } from '../types/dynamo.types';
import { DatabaseWebSocketHeartbeat, InferredWebSocketMessage, WebSocketHeartbeat } from '../types/websockets.types';
import { dynamo } from '../utils/dynamo/dynamo.service';

export type MqttClientType = mqtt.MqttClient;

export const createWebsocketConnection = (
	endpoint: string,
	authorizer: string,
	token?: string,
	identifier?: string,
): { client: MqttClientType; clientId: string } => {
	const clientId = `client_` + (identifier ?? createId());
	return {
		client: mqtt.connect(`wss://${endpoint}/mqtt?x-amz-customauthorizer-name=${authorizer}`, {
			protocolVersion: 5,
			manualConnect: true,
			username: '',
			password: `${clientId}${token ? `::${token}` : ''}`,
			clientId,
		}),
		clientId,
	};
};

export const storeWebsocketHeartbeat = async (
	clientId: string,
	timestamp: number,
	payload: InferredWebSocketMessage<'heartbeat'>['payload'],
) => {
	const heartbeat: WebSocketHeartbeat = {
		timestamp,
		payload,
	};
	const res = await dynamo.put({
		TableName: process.env.TABLE_NAME,
		Item: {
			pk: `${KeyPrefix.WEBSOCKET_HEARTBEAT}`,
			sk: `${KeyPrefix.WEBSOCKET_HEARTBEAT}${clientId}`,
			...heartbeat,
			entityType: EntityType.WEBSOCKET_HEARTBEAT,
		} satisfies DatabaseWebSocketHeartbeat,
	});

	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to store websocket heartbeat',
		});

	return res;
};
