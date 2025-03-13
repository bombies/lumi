import { createWebsocketConnection, MqttClientType } from '@lumi/core/websockets/websockets.service';
import { ErrorWithReasonCode } from 'mqtt';

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
};

export const connectToWebsocket = (args: ConnectToWebsocketArgs) => {
	const { client: mqttConnection, clientId } = createWebsocketConnection(
		args.endpoint,
		args.authorizer,
		args.token,
		args.identifier,
	);

	mqttConnection.on('packetsend', packet => {
		logger.debug(`Packet Send: (${clientId})`, packet);
	});

	mqttConnection.on('packetreceive', packet => {
		logger.debug(`Packet Receive: (${clientId})`, packet);
	});

	mqttConnection.on('connect', async () => {
		const cb = args?.onConnect?.(mqttConnection, clientId);
		if (cb instanceof Promise) await cb;
	});

	mqttConnection.on('disconnect', async () => {
		const cb = args?.onDisconnect?.(clientId);
		if (cb instanceof Promise) await cb;
	});

	mqttConnection.on('error', async e => {
		console.error('WS Error:', e);
		const cb = args?.onError?.(e, clientId);
		if (cb instanceof Promise) await cb;
	});

	mqttConnection.on('message', async (topic, event) => {
		const message = new TextDecoder('utf8').decode(new Uint8Array(event));
		const jsonMsg = JSON.parse(message);
		const cb = args?.onMessage?.(jsonMsg, clientId);
		if (cb instanceof Promise) await cb;
	});

	mqttConnection.connect();

	return mqttConnection;
};
