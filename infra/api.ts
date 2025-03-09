import { valkeyCache } from './cache';
import { db } from './db';
import { authSecret, mailerHostSecret, mailerPasswordSecret, mailerPortSecret, mailerUserSecret } from './secrets';
import { contentBucket } from './storage';

export const trpc = new sst.aws.Function('Trpc', {
	url: $dev
		? true
		: {
				cors: {
					allowOrigins: [`https://lumi.ajani.me`],
				},
			},
	link: [contentBucket, db, valkeyCache, mailerHostSecret, mailerPasswordSecret, mailerUserSecret, mailerPortSecret],
	environment: {
		AUTH_SECRET: authSecret.value,
		TABLE_NAME: db.name,
	},
	copyFiles: [{ from: 'cdn-keys/private_key.pem', to: 'cdn_private_key.pem' }],
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
		domain: 'api.lumi.ajani.me',
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
