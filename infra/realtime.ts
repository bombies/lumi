import { accountId } from './constants';
import { db } from './db';

export const notificationsTopic = `${$app.name}/${$app.stage}/notifications`;

export const realtimeServer = new sst.aws.Realtime('RealtimeServer', {
	authorizer: {
		handler: 'packages/functions/websocket/authorizer.handler',
		link: [db],
		environment: {
			NOTIFICATIONS_TOPIC: notificationsTopic,
			AWS_ACCOUNT_ID: accountId,
			TABLE_NAME: db.name,
		},
	},
});

export const socketCleanupScheduler = new sst.aws.Cron('SocketCleanupScheduler', {
	function: {
		handler: 'packages/functions/websocket/cleanup.handler',
		link: [db, realtimeServer],
		environment: {
			NOTIFICATIONS_TOPIC: notificationsTopic,
			TABLE_NAME: db.name,
		},
	},
	schedule: 'rate(5 minutes)',
});

export const heartbeatSubscriber = realtimeServer.subscribe(
	{
		handler: 'packages/functions/websocket/heartbeat.subscriber',
		link: [db],
		environment: {
			TABLE_NAME: db.name,
		},
	},
	{
		filter: notificationsTopic + '/#',
	},
);
