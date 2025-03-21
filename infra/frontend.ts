import { trpc } from './api';
import { db } from './db';
import { apiDNS, webDNS } from './dns';
import { notificationsTopic, realtimeServer } from './realtime';
import {
	authSecret,
	cdnPrivateKey,
	mailerHostSecret,
	mailerPasswordSecret,
	mailerPortSecret,
	mailerUserSecret,
	redisHost,
	redisPassword,
	redisPort,
	redisUser,
	supabaseKey,
	supabaseUrl,
	vapidPrivateKey,
	vapidPublicKey,
} from './secrets';
import { contentBucket, contentCdn, contentCdnPublicKey } from './storage';

export const frontend = new sst.aws.Nextjs('Frontend', {
	path: 'packages/frontend',
	dev: {
		command: 'bun run dev',
	},
	cdn: false,
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
	// domain: !$dev ? webDNS : undefined,
	environment: {
		APP_STAGE: $app.stage,
		AUTH_SECRET: authSecret.value,
		NEXT_PUBLIC_SUPABASE_URL: supabaseUrl.value,
		NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey.value,
		AUTH_TRUST_HOST: !$dev ? 'true' : undefined,
		NEXT_PUBLIC_TRPC_URL: !$dev ? `https://${apiDNS}` : trpc.url,
		NEXT_PUBLIC_CANONICAL_URL: !$dev ? `https://${webDNS}` : 'https://localhost:3000',
		TABLE_NAME: db.name,
		NEXT_PUBLIC_VAPID_PUBLIC_KEY: vapidPublicKey.value,
		VAPID_PRIVATE_KEY: vapidPrivateKey.value,
		NEXT_PUBLIC_NOTIFICATIONS_TOPIC: notificationsTopic,
		NEXT_PUBLIC_DEV_MODE: $app.stage === 'development' ? 'true' : 'false',
		CONTENT_BUCKET_NAME: contentBucket.name,
		CONTENT_BUCKET_ENDPOINT: contentBucket.nodes.bucket.bucketRegionalDomainName,
		CDN_PRIVATE_KEY: cdnPrivateKey,
		KEY_PAIR_ID: contentCdnPublicKey.id,
		CDN_URL: contentCdn.url,
	},
	permissions: [
		{
			actions: ['iot:*'],
			effect: 'allow',
			resources: ['*'],
		},
	],
});
