import { authSecret, websocketToken } from './secrets';

export const notificationsTopic = `${$app.name}/${$app.stage}/notifications`;

export const realtimeServer = new sst.aws.Realtime('RealtimeServer', {
	authorizer: {
		handler: 'packages/functions/websocket/authorizer.handler',
		link: [websocketToken],
		environment: {
			NOTIFICATIONS_TOPIC: notificationsTopic,
			WEB_SOCKET_TOKEN: websocketToken.value,
		},
	},
});

export const notificationsSubscriber = realtimeServer.subscribe(
	{
		handler: 'packages/functions/websocket/notifications.subscriber',
		environment: {
			WEB_SOCKET_TOKEN: websocketToken.value,
		},
	},
	{
		filter: notificationsTopic + '/*',
	},
);
