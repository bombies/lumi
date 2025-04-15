import redis, { RedisHashKeys } from '../redis/redis';
import { signCdnUrl } from '../utils/s3/cloudfront.service';
import { ContentPaths } from '../utils/s3/s3.service';
import { Moment } from './moment.types';

export const attachUrlsToMoment = async (moment: Moment): Promise<Moment> => {
	return {
		...moment,
		videoUrl: await signMomentUrl(
			RedisHashKeys.momentSignedUrl(moment.id),
			ContentPaths.relationshipMoments(moment.relationshipId, moment.objectKey, {
				withHost: true,
			}),
		),
		thumbnailUrl:
			moment.thumbnailObjectKey &&
			(await signMomentUrl(
				RedisHashKeys.momentThumbnailSignedUrl(moment.id),
				ContentPaths.relationshipMoments(moment.relationshipId, moment.thumbnailObjectKey, {
					withHost: true,
				}),
			)),
	};
};

export const signMomentUrl = async (key: string, url: string) => {
	const cachedUrl = await redis.get(key);
	if (cachedUrl) return cachedUrl;

	const signedUrl = signCdnUrl(url, {
		expiresIn: 30 * 60 * 1000,
	});

	await redis.set(key, signedUrl);
	// Expiring the hash field in 29 minutes to prevent a stale URL from being used
	await redis.setex(key, 29 * 60, signedUrl);
	return signedUrl;
};
