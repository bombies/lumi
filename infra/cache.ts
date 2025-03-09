import { Linkable } from '../.sst/platform/src/components';

Linkable.wrap(aws.elasticache.ServerlessCache, cache => ({
	properties: {
		engine: cache.engine,
		host: cache.endpoints[0].address,
		port: cache.endpoints[0].port,
	},
	include: [
		sst.aws.permission({
			actions: ['elasticache:*'],
			resources: [cache.arn],
		}),
	],
}));

export const valkeyCache = new aws.elasticache.ServerlessCache('ValkeyCache', {
	engine: 'valkey',
	name: `lumi-${$app.stage}-cache`,
	cacheUsageLimits: {
		dataStorage: {
			maximum: $dev ? 1 : 5,
			unit: 'GB',
		},
		ecpuPerSeconds: [
			{
				maximum: 5120,
			},
		],
	},
	dailySnapshotTime: '09:00',
	description: 'Valkey cache for storing session data',
	majorEngineVersion: '7',
	snapshotRetentionLimit: 1,
});
