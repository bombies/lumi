import { trpc } from './api';
import { db } from './db';
import { apiDNS, webDNS } from './dns';
import { notificationsTopic, realtimeServer } from './realtime';
import {
	authSecret,
	cdnPrivateKey,
	frontendCdnCachePolicyId,
	mailerHostSecret,
	mailerPasswordSecret,
	mailerPortSecret,
	mailerUserSecret,
	postgresConnectionString,
	postgresDatabase,
	postgresHost,
	postgresPassword,
	postgresPort,
	postgresUsername,
	redisHost,
	redisPassword,
	redisPort,
	redisUser,
	sentryAuthToken,
	sentryDsn,
	spotifyClientId,
	spotifyClientSecret,
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
	server: {
		runtime: 'nodejs22.x',
		install: ['sharp'],
	},
	cachePolicy: $app.stage !== 'staging' ? frontendCdnCachePolicyId.value : undefined,
	openNextVersion: '3.5.6',
	warm: $app.stage === 'production' ? 5 : 0,
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
		spotifyClientId,
		spotifyClientSecret,

		postgresConnectionString,
		postgresHost,
		postgresUsername,
		postgresPort,
		postgresDatabase,
		postgresPassword,
	],
	// domain: !$dev ? webDNS : undefined,
	environment: {
		BETTER_AUTH_SECRET: authSecret.value,
		BETTER_AUTH_URL: !$dev ? `https://${webDNS}` : 'https://localhost:3000',

		AUTH_SECRET: authSecret.value,
		// @ts-ignore
		AUTH_TRUST_HOST: !$dev ? 'true' : undefined,

		APP_STAGE: $app.stage,
		NEXT_PUBLIC_APP_STAGE: $app.stage,
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
		CDN_URL: $interpolate`${contentCdn.domainUrl.apply(domainUrl => domainUrl ?? contentCdn.url)}`,
		NEXT_PUBLIC_SPOTIFY_CLIENT_ID: spotifyClientId.value,
		SPOTIFY_CLIENT_SECRET: spotifyClientSecret.value,

		SENTRY_AUTH_TOKEN: sentryAuthToken.value,
		NEXT_PUBLIC_SENTRY_DSN: sentryDsn.value,
	},
	permissions: [
		{
			actions: ['iot:*'],
			effect: 'allow',
			resources: ['*'],
		},
	],
});
