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
	sentryAuthToken,
	vapidPrivateKey,
	vapidPublicKey,
	websocketToken,
} from './secrets';
import { contentBucket, contentCdn, contentCdnPublicKey } from './storage';

export const trpc = new sst.aws.Function('Trpc', {
	url: $dev
		? true
		: {
				cors: {
					allowOrigins: [`https://${webDNS}`],
				},
			},
	runtime: 'nodejs22.x',
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
		// @ts-ignore
		NODE_TLS_REJECT_UNAUTHORIZED: $dev ? '0' : undefined,

		SENTRY_AUTH_TOKEN: sentryAuthToken.value,
	},
	handler: 'packages/functions/api/index.handler',
});

let apiCdn: sst.aws.Cdn | undefined = undefined;

if (!$dev)
	apiCdn = new sst.aws.Cdn('ApiCdn', {
		origins: [
			{
				domainName: trpc.url.apply(url => url.split('/')[2]),
				originId: 'ApiGateway',
				originPath: '',
				customOriginConfig: {
					httpPort: 80,
					httpsPort: 443,
					originProtocolPolicy: 'https-only',
					originSslProtocols: ['TLSv1', 'TLSv1.1', 'TLSv1.2'],
				},
			},
		],
		domain: apiDNS,
		defaultCacheBehavior: {
			allowedMethods: ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'],
			cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
			targetOriginId: 'ApiGateway',
			forwardedValues: {
				queryString: true,
				headers: ['Accept', 'x-api-key', 'Authorization'],
				cookies: {
					forward: 'none',
				},
			},
			viewerProtocolPolicy: 'redirect-to-https',
			compress: true,
			minTtl: 0,
			defaultTtl: 0,
		},
	});
