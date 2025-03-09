import Redis from 'ioredis';
import { Resource } from 'sst';

const redis = new Redis(
	`rediss://${Resource.RedisUser.value}:${Resource.RedisPassword.value}@${Resource.RedisHost.value}:${Resource.RedisPort.value}`,
	{
		keyPrefix: `lumi::${process.env.APP_STAGE}::`,
		lazyConnect: true,
	},
);
export default redis;
