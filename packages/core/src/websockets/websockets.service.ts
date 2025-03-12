import { createId } from '@paralleldrive/cuid2';
import { iot, mqtt } from 'aws-iot-device-sdk-v2';

export const createWebsocketConnection = async (endpoint: string, authorizer: string, token?: string) => {
	const clientId = createId();
	const config = iot.AwsIotMqttConnectionConfigBuilder.new_with_websockets()
		.with_clean_session(true)
		.with_client_id('client_' + clientId)
		.with_endpoint(endpoint)
		.with_custom_authorizer('', authorizer, '', `${token ? `${token}::${clientId}` : `${clientId}`}`)
		.with_keep_alive_seconds(1200)
		.build();
	const client = new mqtt.MqttClient();
	return client.new_connection(config);
};
