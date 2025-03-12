import { trpc } from './api';
import { db } from './db';
import { notificationsTopic, realtimeServer } from './realtime';
import {
	authSecret,
	mailerHostSecret,
	mailerPasswordSecret,
	mailerPortSecret,
	mailerUserSecret,
	redisHost,
	redisPassword,
	redisPort,
	redisUser,
	vapidPrivateKey,
	vapidPublicKey,
	websocketToken,
} from './secrets';
import { contentBucket } from './storage';

export const frontend = new sst.aws.Nextjs('Frontend', {
	path: 'packages/frontend',
	dev: {
		command: 'bun run dev',
	},
	openNextVersion: '3.5.1',
	link: [
		trpc,
		contentBucket,
		db,
		mailerHostSecret,
		mailerPasswordSecret,
		mailerUserSecret,
		mailerPortSecret,
		redisHost,
		redisPort,
		redisUser,
		redisPassword,
		realtimeServer,
		authSecret,
	],
	domain: $app.stage === 'production' ? 'lumi.ajani.me' : undefined,
	environment: {
		APP_STAGE: $app.stage,
		AUTH_SECRET: authSecret.value,
		NEXT_PUBLIC_TRPC_URL: $app.stage === 'production' ? 'https://api.lumi.ajani.me' : trpc.url,
		NEXT_PUBLIC_CANONICAL_URL: $app.stage === 'production' ? 'https://lumi.ajani.me' : 'http://localhost:3000',
		TABLE_NAME: db.name,
		NEXT_PUBLIC_VAPID_PUBLIC_KEY: vapidPublicKey.value,
		VAPID_PRIVATE_KEY: vapidPrivateKey.value,
		NEXT_PUBLIC_NOTIFICATIONS_TOPIC: notificationsTopic,
		NEXT_PUBLIC_DEV_MODE: $app.stage === 'development' ? 'true' : 'false',
	},
	permissions: [
		{
			actions: ['iot:*'],
			effect: 'allow',
			resources: ['*'],
		},
	],
});
