import { trpc } from './api';
import { db } from './db';
import { frontend } from './frontend';
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
	handler: 'packages/functions/affirmations/sender.handler',
	link: [realtimeServer, vapidPublicKey, vapidPrivateKey, db],
	runtime: 'nodejs22.x',
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
		handler: 'packages/functions/affirmations/aggregator.handler',
		runtime: 'nodejs22.x',
		link: [db, affirmationSenderQueue],
		environment: {
			TABLE_NAME: db.name,
			SENTRY_AUTH_TOKEN: sentryAuthToken.value,
		},
	},
});

export let lambdaWarmer: sst.aws.Cron;

if ($app.stage === 'production') {
	lambdaWarmer = new sst.aws.Cron('LamdaWarmer', {
		schedule: 'rate(5 minutes)',
		function: {
			handler: 'packages/functions/cron/warmer.handler',
			runtime: 'nodejs22.x',
			link: [frontend, trpc],
			environment: {
				API_FUNCTION_NAME: trpc.nodes.function.name,
				SENTRY_AUTH_TOKEN: sentryAuthToken.value,
			},
			permissions: frontend.nodes.server && [
				{
					actions: ['lambda:InvokeFunction'],
					resources: [frontend.nodes.server.arn],
				},
			],
		},
	});
}
