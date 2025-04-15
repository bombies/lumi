import { createId } from '@paralleldrive/cuid2';
import { TRPCError } from '@trpc/server';
import mqtt from 'mqtt';

import { dynamo } from '../utils/dynamo/dynamo.service';
import { DynamoKey, EntityType } from '../utils/dynamo/dynamo.types';
import {
	DatabaseWebSocketHeartbeat,
	Event,
	InferredWebSocketMessage,
	InferredWebSocketMessagePayload,
	WebSocketHeartbeat,
	WebSocketMessage,
} from '../websockets/websockets.types';

export type MqttClientType = mqtt.MqttClient;

type CreateWebsocketConnectionArgs = {
	endpoint: string;
	authorizer: string;
	token?: string;
	identifier?: string;
} & mqtt.IClientOptions;

export const createWebsocketConnection = ({
	endpoint,
	authorizer,
	token,
	identifier,
	...args
}: CreateWebsocketConnectionArgs): { client: MqttClientType; clientId: string } => {
	const clientId = `client_` + (identifier ? identifier + '_' + createId() : createId());
	return {
		client: mqtt.connect(`wss://${endpoint}/mqtt?x-amz-customauthorizer-name=${authorizer}`, {
			protocolVersion: 5,
			manualConnect: true,
			username: '',
			password: `${clientId}${token ? `::${token}` : ''}`,
			clientId,
			...args,
		}),
		clientId,
	};
};

type CreateAsyncWebsocketConnectionArgs = {
	endpoint: string;
	authorizer: string;
	token?: string;
	identifier?: string;
} & mqtt.IClientOptions;

export const createAsyncWebsocketConnection = async ({
	endpoint,
	authorizer,
	token,
	identifier,
	...args
}: CreateAsyncWebsocketConnectionArgs) => {
	const clientId = `client_` + (identifier ? identifier + '_' + createId() : createId());
	return mqtt.connectAsync(`wss://${endpoint}/mqtt?x-amz-customauthorizer-name=${authorizer}`, {
		protocolVersion: 5,
		username: '',
		password: `${clientId}${token ? `::${token}` : ''}`,
		clientId,
		manualConnect: false,
		...args,
	});
};

type EmitWebSocketEventArgs<T extends Event> = {
	client: mqtt.MqttClient;
	topic: string;
	event: T;
	payload: InferredWebSocketMessagePayload<T>;
	source?: 'client' | 'server';
};

export const emitAsyncWebsocketEvent = async <T extends Event>({
	client,
	topic,
	event,
	payload,
	source,
}: EmitWebSocketEventArgs<T>) =>
	await client.publishAsync(
		topic,
		JSON.stringify({
			type: event,
			timestamp: Date.now(),
			source: source ?? 'server',
			payload,
		} satisfies WebSocketMessage<T, typeof payload>),
	);

export const emitWebsocketEventSync = <T extends Event>({
	client,
	topic,
	event,
	payload,
	source,
}: EmitWebSocketEventArgs<T>) =>
	client.publish(
		topic,
		JSON.stringify({
			type: event,
			timestamp: Date.now(),
			source: source ?? 'server',
			payload,
		} satisfies WebSocketMessage<T, typeof payload>),
	);

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
			pk: DynamoKey.webSocketHeartbeat.pk(),
			sk: DynamoKey.webSocketHeartbeat.sk(clientId),
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
