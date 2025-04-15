import { createWebsocketConnection, MqttClientType } from '@lumi/core/websockets/websockets.service';
import { ErrorWithReasonCode, IClientOptions } from 'mqtt';

import { logger } from '@/lib/logger';

type ConnectToWebsocketArgs = {
	endpoint: string;
	authorizer: string;
	identifier?: string;
	token?: string;
	onConnect?:
		| ((connection: MqttClientType, clientId: string) => void)
		| ((connection: MqttClientType, clientId: string) => Promise<void>);
	onDisconnect?: ((clientId: string) => void) | ((clientId: string) => Promise<void>);
	onError?:
		| ((e: Error | ErrorWithReasonCode, clientId: string) => void)
		| ((e: Error | ErrorWithReasonCode, clientId: string) => Promise<void>);
	onMessage?:
		| ((message: unknown, clientId: string) => void)
		| ((message: unknown, clientId: string) => Promise<void>);
} & IClientOptions;

const RECONNECT_MAX = 5;

export const connectToWebsocket = ({
	endpoint,
	authorizer,
	token,
	identifier,
	onConnect,
	onDisconnect,
	onError,
	onMessage,
	...clientArgs
}: ConnectToWebsocketArgs) => {
	const { client: mqttConnection, clientId } = createWebsocketConnection({
		endpoint,
		authorizer,
		token,
		identifier,
		...clientArgs,
	});

	mqttConnection.on('packetsend', packet => {
		logger.debug(`Packet Send: (${clientId})`, packet);
	});

	mqttConnection.on('packetreceive', packet => {
		logger.debug(`Packet Receive: (${clientId})`, packet);
	});

	mqttConnection.on('connect', async () => {
		const cb = onConnect?.(mqttConnection, clientId);
		if (cb instanceof Promise) await cb;
	});

	mqttConnection.on('disconnect', async () => {
		const cb = onDisconnect?.(clientId);
		if (cb instanceof Promise) await cb;
	});

	mqttConnection.on('error', async e => {
		console.error('WS Error:', e);
		const cb = onError?.(e, clientId);
		if (cb instanceof Promise) await cb;
	});

	mqttConnection.on('message', async (topic, event) => {
		const message = new TextDecoder('utf8').decode(new Uint8Array(event));
		const jsonMsg = JSON.parse(message);
		const cb = onMessage?.(jsonMsg, clientId);
		if (cb instanceof Promise) await cb;
	});

	mqttConnection.on('reconnect', async () => {
		if (mqttConnection._reconnectCount === RECONNECT_MAX) {
			logger.info('Reached the max websocket reconnect limit. Closing connection.');
			mqttConnection._reconnectCount = 0;
			mqttConnection.end(true);
		}
	});

	mqttConnection.connect();

	return mqttConnection;
};
