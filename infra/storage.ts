import { appify } from './utils';

const originAccessIdentity = new aws.cloudfront.OriginAccessIdentity(appify('ContentCdnOriginAccessIdentity'));

export const contentBucket = new sst.aws.Bucket(`ContentBucket`, {
	transform: {
		policy(args) {
			args.policy = {
				Version: '2012-10-17',
				Statement: [
					{
						Effect: 'Allow',
						Principal: {
							AWS: originAccessIdentity.iamArn,
						},
						Action: ['s3:GetObject'],
						Resource: [$interpolate`${contentBucket.arn}/*`],
					},
				],
			};
		},
	},
});

export const contentCdnPublicKey = aws.cloudfront.PublicKey.get(
	`${appify('cdn-public-key')}`,
	$app.stage === 'staging' ? 'KO11CBZIPW9TI' : 'K3ISC02EJNN5G',
);

export const contentCdnKeyGroup = aws.cloudfront.KeyGroup.get(
	`${appify('cdn-key-group')}`,
	$app.stage === 'staging' ? '9ab92ced-8c35-494a-9336-75459ecd8438' : '4c6a7e48-1680-426d-9949-81cd3de6e744',
);

sst.Linkable.wrap(aws.cloudfront.KeyGroup, kg => ({
	properties: { id: kg.id, items: kg.items },
}));

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
	domain: $app.stage === 'production' ? 'cdn.lumi.ajani.me' : undefined,
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
