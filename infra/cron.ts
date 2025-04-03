import { db } from './db';
import { notificationsTopic, realtimeServer } from './realtime';
import { vapidPrivateKey, vapidPublicKey } from './secrets';

const affirmationSenderDLQ = new sst.aws.Queue('AffirmationSenderDLQ');

export const affirmationSenderQueue = new sst.aws.Queue('AffirmationSenderQueue', {
	dlq: {
		queue: affirmationSenderDLQ.arn,
		retry: 3,
	},
});

affirmationSenderQueue.subscribe({
	handler: 'packages/functions/affirmations/sender.handler',
	link: [realtimeServer, vapidPublicKey, vapidPrivateKey, db],
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
	schedule: $dev ? 'rate(30 minutes)' : 'cron(0 16 * * ? *)',
	function: {
		handler: 'packages/functions/affirmations/aggregator.handler',
		link: [db, affirmationSenderQueue],
		environment: {
			TABLE_NAME: db.name,
		},
	},
});
