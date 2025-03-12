import { accountId } from './constants';

export const notificationsTopic = `${$app.name}/${$app.stage}/notifications`;

export const realtimeServer = new sst.aws.Realtime('RealtimeServer', {
	authorizer: {
		handler: 'packages/functions/websocket/authorizer.handler',
		environment: {
			NOTIFICATIONS_TOPIC: notificationsTopic,
			AWS_ACCOUNT_ID: accountId,
		},
	},
});

export const notificationsSubscriber = realtimeServer.subscribe(
	{
		handler: 'packages/functions/websocket/notifications.subscriber',
	},
	{
		filter: notificationsTopic + '/*',
	},
);
