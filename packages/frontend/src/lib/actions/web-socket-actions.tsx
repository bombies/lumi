import { createWebsocketConnection } from '@lumi/core/websockets/websockets.service';
import { CrtError, mqtt } from 'aws-iot-device-sdk-v2';

type ConnectToWebsocketArgs = {
	endpoint: string;
	authorizer: string;
	token?: string;
	onConnect?:
		| ((connection: mqtt.MqttClientConnection) => void)
		| ((connection: mqtt.MqttClientConnection) => Promise<void>);
	onDisconnect?: (() => void) | (() => Promise<void>);
	onError?: ((e: CrtError) => void) | ((e: CrtError) => Promise<void>);
	onMessage?: ((message: unknown) => void) | ((message: unknown) => Promise<void>);
};

export const connectToWebsocket = async (args: ConnectToWebsocketArgs) => {
	const mqttConnection = await createWebsocketConnection(args.endpoint, args.authorizer, args.token);

	mqttConnection.on('connect', async () => {
		if (args?.onConnect instanceof Promise) await args?.onConnect?.(mqttConnection);
		else args?.onConnect?.(mqttConnection);
	});

	mqttConnection.on('connection_failure', err => {
		console.log('Connection failure event: ' + err.error.toString());
		throw err;
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

	mqttConnection.on('message', async (_fullTopic, payload) => {
		const message = new TextDecoder('utf8').decode(new Uint8Array(payload));
		const jsonMsg = JSON.parse(message);
		if (args?.onMessage instanceof Promise) await args?.onMessage(jsonMsg);
		else args?.onMessage?.(jsonMsg);
	});

	await mqttConnection.connect();

	return mqttConnection;
};
