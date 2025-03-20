import { cdnPrivateKey, redisHost, redisPassword, redisPort, redisUser } from './secrets';
import { contentBucket, contentCdn, contentCdnPublicKey } from './storage';

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
	'RelationshipStreamHandler',
	{
		handler: 'packages/functions/db/stream.handler',
		link: [db],
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
	'MomentMetadataDeletionHandler',
	{
		handler: 'packages/functions/db/moment-deletion.handler',
		link: [db, contentBucket],
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
	'MomentThumbnailTranscoder',
	{
		handler: 'packages/functions/db/moment-thumbnail-transcoder.handler',
		link: [contentBucket, db, redisHost, redisPort, redisUser, redisPassword],
		environment: {
			APP_STAGE: $app.stage,
			TABLE_NAME: db.name,
			CDN_PRIVATE_KEY: cdnPrivateKey,
			KEY_PAIR_ID: contentCdnPublicKey.id,
			CDN_URL: contentCdn.url,
		},
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
