import Redis from 'ioredis';
import { Resource } from 'sst';

import { substituteVariables } from '../utils/utils';

const redis = new Redis(
	`rediss://${Resource.RedisUser.value}:${Resource.RedisPassword.value}@${Resource.RedisHost.value}:${Resource.RedisPort.value}`,
	{
		keyPrefix: `lumi::${process.env.APP_STAGE}::`,
		lazyConnect: true,
	},
);

export class RedisHashKeys {
	private static MOMENT_SIGNED_URL = 'moment_signed_url::{momentId}';
	private static MOMENT_THUMBNAIL_SIGNED_URL = 'moment_thumbnail_signed_url::{momentId}';

	private constructor() {}

	static momentSignedUrl(momentId: string) {
		return substituteVariables(this.MOMENT_SIGNED_URL, { momentId });
	}

	static momentThumbnailSignedUrl(momentId: string) {
		return substituteVariables(this.MOMENT_THUMBNAIL_SIGNED_URL, { momentId });
	}
}
export default redis;
