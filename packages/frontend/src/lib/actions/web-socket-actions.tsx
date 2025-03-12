import { createWebsocketConnection, MqttClientType } from '@lumi/core/websockets/websockets.service';
import { ErrorWithReasonCode } from 'mqtt';

import { logger } from '@/lib/logger';

type ConnectToWebsocketArgs = {
	endpoint: string;
	authorizer: string;
	identifier?: string;
	token?: string;
	onConnect?: ((connection: MqttClientType) => void) | ((connection: MqttClientType) => Promise<void>);
	onDisconnect?: (() => void) | (() => Promise<void>);
	onError?: ((e: Error | ErrorWithReasonCode) => void) | ((e: Error | ErrorWithReasonCode) => Promise<void>);
	onMessage?: ((message: unknown) => void) | ((message: unknown) => Promise<void>);
};

export const connectToWebsocket = async (args: ConnectToWebsocketArgs) => {
	const mqttConnection = await createWebsocketConnection(args.endpoint, args.authorizer, args.token);

	mqttConnection.on('packetsend', packet => {
		logger.debug('Packet Send:', packet);
	});

	mqttConnection.on('packetreceive', packet => {
		logger.debug('Packet Receive:', packet);
	});

	mqttConnection.on('connect', async () => {
		if (args?.onConnect instanceof Promise) await args?.onConnect?.(mqttConnection);
		else args?.onConnect?.(mqttConnection);
	});

	mqttConnection.on('disconnect', async () => {
		if (args?.onDisconnect instanceof Promise) await args?.onDisconnect?.();
		else args?.onDisconnect?.();
	});

	mqttConnection.on('error', async e => {
		console.error('WS Error:', e);
		if (args?.onError instanceof Promise) await args?.onError?.(e);
		else args?.onError?.(e);
	});

	mqttConnection.on('message', async (topic, event) => {
		const message = new TextDecoder('utf8').decode(new Uint8Array(event));
		const jsonMsg = JSON.parse(message);
		logger.debug('Message:', topic, jsonMsg);
		if (args?.onMessage instanceof Promise) await args?.onMessage(jsonMsg);
		else args?.onMessage?.(jsonMsg);
	});

	mqttConnection.connect();

	return mqttConnection;
};
