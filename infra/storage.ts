import { cdnDNS } from './dns';
import { contentCdnKeyGroupId, contentCdnPublicKeyId } from './secrets';
import { appify } from './utils';

const originAccessIdentity = new aws.cloudfront.OriginAccessIdentity(appify('ContentCdnOriginAccessIdentity'));

export const contentBucket = new sst.aws.Bucket(`ContentBucket`);

const customCdnKeyStages = new Set(['production', 'staging']);

export const contentCdnPublicKey = aws.cloudfront.PublicKey.get(
	customCdnKeyStages.has($app.stage) ? `${appify('cdn-public-key')}` : `${$app.name}-ajani-cdn-public-key`,
	contentCdnPublicKeyId.value,
);

export const contentCdnKeyGroup = aws.cloudfront.KeyGroup.get(
	customCdnKeyStages.has($app.stage) ? `${appify('cdn-key-group')}` : `${$app.name}-ajani-cdn-key-group`,
	contentCdnKeyGroupId.value,
);

const contentBucketOriginId = appify('ContentBucketOriginId');
export const contentCdn = new sst.aws.Cdn('ContentCdn', {
	origins: [
		{
			domainName: contentBucket.nodes.bucket.bucketRegionalDomainName,
			originId: contentBucketOriginId,
			s3OriginConfig: {
				originAccessIdentity: originAccessIdentity.cloudfrontAccessIdentityPath,
			},
		},
	],
	domain: !$dev ? cdnDNS : undefined,
	defaultCacheBehavior: {
		allowedMethods: ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'],
		compress: true,
		cachedMethods: ['GET', 'HEAD'],
		targetOriginId: contentBucketOriginId,
		forwardedValues: {
			queryString: false,
			cookies: {
				forward: 'none',
			},
		},
		viewerProtocolPolicy: 'allow-all',
		minTtl: 0,
		defaultTtl: 3600,
		maxTtl: 86400,
	},
	orderedCacheBehaviors: [
		{
			pathPattern: 'private/*',
			viewerProtocolPolicy: 'allow-all',
			minTtl: 0,
			defaultTtl: 3600,
			maxTtl: 86400,
			compress: true,
			allowedMethods: ['GET', 'HEAD'],
			cachedMethods: ['GET', 'HEAD'],
			targetOriginId: contentBucketOriginId,
			trustedKeyGroups: [contentCdnKeyGroup.id],
			forwardedValues: {
				queryString: false,
				cookies: {
					forward: 'none',
				},
			},
		},
	],
});
