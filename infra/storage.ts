const originAccessIdentity = new aws.cloudfront.OriginAccessIdentity(
	'ContentCdnOriginAccessIdentity',
);

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

const contentCdnPublicKey = new aws.cloudfront.PublicKey('ContentCdnPublicKey', {
	comment: 'The public key for the content CDN',
	encodedKey: std
		.file({
			input: 'cdn-keys/public_key.pem',
		})
		.then(invoke => invoke.result),
});

const contentCdnKeyGroup = new aws.cloudfront.KeyGroup('ContentCdnKeyGroup', {
	comment: 'The key group for the content CDN',
	items: [contentCdnPublicKey.id],
	name: 'content-cdn-key-group',
});

const contentBucketOriginId = 'ContentBucketOriginId';
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
			compress: true,
			allowedMethods: ['GET', 'HEAD'],
			cachedMethods: ['GET', 'HEAD'],
			targetOriginId: contentBucketOriginId,
			trustedKeyGroups: [contentCdnKeyGroup.id],
		},
	],
});
