import { contentBucket } from './storage';

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
