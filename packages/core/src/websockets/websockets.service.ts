import { createId } from '@paralleldrive/cuid2';
import { iot, mqtt5 } from 'aws-iot-device-sdk-v2';
import mqtt from 'mqtt';

export type MqttClientType = mqtt.MqttClient;

export const createWebsocketConnection = async (
	endpoint: string,
	authorizer: string,
	token?: string,
	identifier?: string,
): Promise<MqttClientType> => {
	const clientId = `client_` + (identifier ?? createId());
	return mqtt.connect(`wss://${endpoint}/mqtt?x-amz-customauthorizer-name=${authorizer}`, {
		protocolVersion: 5,
		manualConnect: true,
		username: '',
		password: `${clientId}${token ? `::${token}` : ''}`,
		clientId,
	});
};
