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
import { contentBucket } from './storage';
import { appify } from './utils';

export const notificationsTopic = `${$app.name}/${$app.stage}/notifications`;

export const realtimeServer = new sst.aws.Realtime('RealtimeServer', {
	authorizer: {
		handler: 'packages/go/cmd/websocket/authorizer',
		runtime: 'go',
		architecture: 'arm64',
		link: [db, contentBucket],
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
		handler: 'packages/go/cmd/websocket/cleanup',
		link: [db, realtimeServer],
		runtime: 'go',
		architecture: 'arm64',
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
		handler: 'packages/go/cmd/websocket/heartbeat',
		runtime: 'go',
		architecture: 'arm64',
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
		handler: 'packages/go/cmd/websocket/moment-message',
		runtime: 'go',
		architecture: 'arm64',
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
		handler: 'packages/go/cmd/websocket/presence',
		runtime: 'go',
		architecture: 'arm64',
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
		handler: 'packages/go/cmd/websocket/notifications',
		link: [db, vapidPublicKey, vapidPrivateKey, realtimeServer],
		runtime: 'go',
		architecture: 'arm64',
		environment: {
			TABLE_NAME: db.name,
			SENTRY_AUTH_TOKEN: sentryAuthToken.value,
		},
	},
	{
		filter: `${notificationsTopic}/+/notifications`,
	},
);
