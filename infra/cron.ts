import { db } from './db';
import { notificationsTopic, realtimeServer } from './realtime';
import { sentryAuthToken, vapidPrivateKey, vapidPublicKey } from './secrets';
import { appify } from './utils';

const affirmationSenderDLQ = new sst.aws.Queue('AffirmationSenderDLQ');

export const affirmationSenderQueue = new sst.aws.Queue('AffirmationSenderQueue', {
	dlq: {
		queue: affirmationSenderDLQ.arn,
		retry: 3,
	},
});

affirmationSenderQueue.subscribe({
	name: appify('AffirmationSenderHandler'),
	handler: 'packages/go/cmd/affirmation-sender',
	link: [realtimeServer, vapidPublicKey, vapidPrivateKey, db],
	runtime: 'go',
	architecture: 'arm64',
	environment: {
		NOTIFICATIONS_TOPIC: notificationsTopic,
		TABLE_NAME: db.name,
	},
	copyFiles: [
		{
			from: 'packages/frontend/public/favicon-96x96.png',
		},
	],
});

export const affirmationSenderJob = new sst.aws.Cron('AffirmationAggregatorJob', {
	schedule: $dev ? 'rate(30 minutes)' : 'cron(0 14 * * ? *)',
	function: {
		handler: 'packages/go/cmd/affirmation-aggregator',
		runtime: 'go',
		architecture: 'arm64',
		link: [db, affirmationSenderQueue],
		environment: {
			TABLE_NAME: db.name,
			SENTRY_AUTH_TOKEN: sentryAuthToken.value,
			QUEUE_URL: affirmationSenderQueue.url,
		},
	},
});

const anniversarySenderDLQ = new sst.aws.Queue('AnniversarySenderDLQ');

export const anniversarySenderQueue = new sst.aws.Queue('AnniversarySenderQueue', {
	dlq: {
		queue: anniversarySenderDLQ.arn,
		retry: 3,
	},
});

anniversarySenderQueue.subscribe({
	name: appify('AnniversarySenderHandler'),
	handler: 'packages/go/cmd/cron/anniversaries/aggregator',
	link: [realtimeServer, vapidPublicKey, vapidPrivateKey, db],
	runtime: 'go',
	architecture: 'arm64',
	environment: {
		NOTIFICATIONS_TOPIC: notificationsTopic,
		TABLE_NAME: db.name,
		QUEUE_URL: anniversarySenderQueue.url,
	},
	copyFiles: [
		{
			from: 'packages/frontend/public/favicon-96x96.png',
		},
	],
});

export const anniversarySenderJob = new sst.aws.Cron('AnniversaryAggregatorJob', {
	schedule: $dev ? 'rate(30 minutes)' : 'cron(0 14 * * ? *)',
	function: {
		handler: 'packages/go/cmd/cron/anniversaries/sender',
		runtime: 'go',
		architecture: 'arm64',
		link: [db, anniversarySenderQueue, realtimeServer],
		environment: {
			TABLE_NAME: db.name,
			SENTRY_AUTH_TOKEN: sentryAuthToken.value,
		},
	},
});
