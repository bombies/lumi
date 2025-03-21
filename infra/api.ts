import { db } from './db';
import { apiDNS, webDNS } from './dns';
import { notificationsTopic } from './realtime';
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
	websocketToken,
} from './secrets';
import { contentBucket, contentCdn, contentCdnKeyGroup, contentCdnPublicKey } from './storage';

export const trpc = new sst.aws.Function('Trpc', {
	url: $dev
		? true
		: {
				cors: {
					allowOrigins: [`https://${webDNS}`],
				},
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
	],
	environment: {
		APP_STAGE: $app.stage,
		AUTH_SECRET: authSecret.value,
		TABLE_NAME: db.name,
		NOTIFICATIONS_TOPIC: notificationsTopic,
		WEB_SOCKET_TOKEN: websocketToken.value,
		CDN_PRIVATE_KEY: cdnPrivateKey,
		KEY_PAIR_ID: contentCdnPublicKey.id,
		CDN_URL: contentCdn.url,
	},
	handler: 'packages/functions/api/index.handler',
});
