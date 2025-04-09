import { cdnPrivateKey, redisHost, redisPassword, redisPort, redisUser } from './secrets';
import { contentBucket, contentCdn, contentCdnPublicKey } from './storage';
import { appify } from './utils';

export const db = new sst.aws.Dynamo('Database', {
	fields: {
		pk: 'string',
		sk: 'string',
		gsi1pk: 'string',
		gsi1sk: 'string',
		gsi2pk: 'string',
		gsi2sk: 'string',
		gsi3pk: 'string',
		gsi3sk: 'string',
		gsi4pk: 'string',
		gsi4sk: 'string',
	},
	primaryIndex: { hashKey: 'pk', rangeKey: 'sk' },
	stream: 'new-and-old-images',
	globalIndexes: {
		GSI1: {
			hashKey: 'gsi1pk',
			rangeKey: 'gsi1sk',
		},
		GSI2: {
			hashKey: 'gsi2pk',
			rangeKey: 'gsi2sk',
		},
		GSI3: {
			hashKey: 'gsi3pk',
			rangeKey: 'gsi3sk',
		},
		GSI4: {
			hashKey: 'gsi4pk',
			rangeKey: 'gsi4sk',
		},
	},
	ttl: 'expireAt',
});

db.subscribe(
	appify('RelationshipStreamHandler'),
	{
		handler: 'packages/functions/db/stream.handler',
		link: [db, redisHost, redisPort, redisUser, redisPassword],
		environment: {
			TABLE_NAME: db.name,
		},
		runtime: 'nodejs22.x',
	},
	{
		filters: [
			{
				dynamodb: {
					Keys: {
						pk: {
							S: [{ prefix: 'rship#' }],
						},
					},
				},
			},
		],
	},
);

db.subscribe(
	appify('MomentMetadataDeletionHandler'),
	{
		handler: 'packages/functions/db/moment-deletion.handler',
		link: [db, contentBucket],
		runtime: 'nodejs22.x',
	},
	{
		filters: [
			{
				eventName: ['REMOVE'],
				dynamodb: {
					Keys: {
						pk: {
							S: [{ prefix: 'moment::details#' }],
						},
					},
				},
			},
		],
	},
);

db.subscribe(
	appify('MomentThumbnailTranscoder'),
	{
		handler: 'packages/functions/db/moment-thumbnail-transcoder.handler',
		link: [contentBucket, db, redisHost, redisPort, redisUser, redisPassword],
		environment: {
			APP_STAGE: $app.stage,
			TABLE_NAME: db.name,
			CDN_PRIVATE_KEY: cdnPrivateKey,
			KEY_PAIR_ID: contentCdnPublicKey.id,
			CDN_URL: $interpolate`${contentCdn.domainUrl.apply(domainUrl => domainUrl ?? contentCdn.url)}`,
		},
		runtime: 'nodejs22.x',
		nodejs: { install: ['ffmpeg-static'] },
	},
	{
		filters: [
			{
				eventName: ['INSERT'],
				dynamodb: {
					Keys: {
						pk: {
							S: [{ prefix: 'moment::details#' }],
						},
					},
				},
			},
		],
	},
);

db.subscribe(
	appify('MomentTagOperationHandler'),
	{
		handler: 'packages/functions/db/moment-tag.handler',
		link: [db, redisHost, redisPort, redisUser, redisPassword],
		runtime: 'nodejs22.x',
		environment: {
			TABLE_NAME: db.name,
		},
	},
	{
		filters: [
			{
				eventName: ['INSERT', 'REMOVE'],
				dynamodb: {
					Keys: {
						pk: {
							S: [{ prefix: 'moment::tag#' }],
						},
					},
				},
			},
		],
	},
);

db.subscribe(
	appify('RelationshipMomentTagDeletionHandler'),
	{
		handler: 'packages/functions/db/relationship-moment-tag.handler',
		runtime: 'nodejs22.x',
		link: [db, redisHost, redisPort, redisUser, redisPassword],
		environment: {
			TABLE_NAME: db.name,
		},
	},
	{
		filters: [
			{
				eventName: ['REMOVE'],
				dynamodb: {
					Keys: {
						pk: {
							S: [{ prefix: 'relationship::moment::tag#' }],
						},
					},
				},
			},
		],
	},
);
