import { db } from './db';
import { apiDNS, webDNS } from './dns';
import { notificationsTopic, realtimeServer } from './realtime';
import { router } from './router';
import {
	authSecret,
	cdnPrivateKey,
	defaultSentryEnvironmentVariables,
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
import { contentBucket, contentCdn, contentCdnPublicKey } from './storage';

export const trpc = new sst.aws.Function('Trpc', {
	url: $dev
		? true
		: {
				router: router && {
					instance: router,
					domain: apiDNS,
				},
				cors: {
					allowOrigins: [`https://${webDNS}`],
				},
			},
	runtime: 'nodejs22.x',
	nodejs: {
		install: ['@sentry/aws-serverless', '@sentry/profiling-node'],
	},
	link: [
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
		vapidPublicKey,
		vapidPrivateKey,
	],
	environment: {
		APP_STAGE: $app.stage,
		AUTH_SECRET: authSecret.value,
		TABLE_NAME: db.name,
		NOTIFICATIONS_TOPIC: notificationsTopic,
		WEB_SOCKET_TOKEN: websocketToken.value,
		CDN_PRIVATE_KEY: cdnPrivateKey,
		KEY_PAIR_ID: contentCdnPublicKey.id,
		CDN_URL: $interpolate`${contentCdn.domainUrl.apply(domainUrl => domainUrl ?? contentCdn.url)}`,
		FRONTEND_URL: !$dev ? `https://${webDNS}` : 'https://localhost:3000',
		// @ts-expect-error It's complaining about the undefined but, but it works fine. Just some weird typings with
		// pulumi's Input type.
		NODE_TLS_REJECT_UNAUTHORIZED: $dev ? '0' : undefined,

		...defaultSentryEnvironmentVariables,
	},
	handler: 'packages/functions/api/index.handler',
});
