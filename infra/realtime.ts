import { accountId } from './constants';
import { db } from './db';
import {
	redisHost,
	redisPassword,
	redisPort,
	redisUser,
	sentryAuthToken,
	vapidPrivateKey,
	vapidPublicKey,
} from './secrets';
import { appify } from './utils';

export const notificationsTopic = `${$app.name}/${$app.stage}/notifications`;

export const realtimeServer = new sst.aws.Realtime('RealtimeServer', {
	authorizer: {
		handler: 'packages/functions/websocket/authorizer.handler',
		link: [db],
		runtime: 'nodejs22.x',
		environment: {
			NOTIFICATIONS_TOPIC: notificationsTopic,
			AWS_ACCOUNT_ID: accountId,
			TABLE_NAME: db.name,
			SENTRY_AUTH_TOKEN: sentryAuthToken.value,
		},
	},
});

export const socketCleanupScheduler = new sst.aws.Cron('SocketCleanupScheduler', {
	function: {
		handler: 'packages/functions/websocket/cleanup.handler',
		link: [db, realtimeServer],
		runtime: 'nodejs22.x',
		environment: {
			NOTIFICATIONS_TOPIC: notificationsTopic,
			TABLE_NAME: db.name,
			SENTRY_AUTH_TOKEN: sentryAuthToken.value,
		},
	},
	schedule: 'rate(5 minutes)',
});

export const heartbeatSubscriber = realtimeServer.subscribe(
	{
		name: appify('HeartbeatHandler'),
		handler: 'packages/functions/websocket/heartbeat.subscriber',
		runtime: 'nodejs22.x',
		link: [db],
		environment: {
			TABLE_NAME: db.name,
			SENTRY_AUTH_TOKEN: sentryAuthToken.value,
		},
	},
	{
		filter: `${notificationsTopic}/relationship/+/heartbeat`,
	},
);

export const momentMessageSubscriber = realtimeServer.subscribe(
	{
		name: appify('MomentMessageHandler'),
		handler: 'packages/functions/websocket/moment-message.subscriber',
		runtime: 'nodejs22.x',
		link: [db, redisHost, redisPort, redisUser, redisPassword],
		environment: {
			TABLE_NAME: db.name,
			SENTRY_AUTH_TOKEN: sentryAuthToken.value,
		},
	},
	{
		filter: `${notificationsTopic}/relationship/+/moment_chat/#`,
	},
);

export const presenceSubscriber = realtimeServer.subscribe(
	{
		name: appify('PresenceHandler'),
		handler: 'packages/functions/websocket/presence.subscriber',
		runtime: 'nodejs22.x',
		link: [db],
		environment: {
			TABLE_NAME: db.name,
			SENTRY_AUTH_TOKEN: sentryAuthToken.value,
		},
	},
	{
		filter: `${notificationsTopic}/relationship/#`,
	},
);

export const notificationSubscriber = realtimeServer.subscribe(
	{
		name: appify('UserNotificationsHandler'),
		handler: 'packages/functions/websocket/notifications.subscriber',
		link: [db, vapidPublicKey, vapidPrivateKey, realtimeServer],
		runtime: 'nodejs22.x',
		environment: {
			TABLE_NAME: db.name,
			SENTRY_AUTH_TOKEN: sentryAuthToken.value,
		},
	},
	{
		filter: `${notificationsTopic}/+/notifications`,
	},
);
