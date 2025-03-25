import { z } from 'zod';

import { createInfiniteDataDto, infiniteDataOrderDto } from '../types/infinite-data.dto';

export const createSongRecommendationDto = z.object({
	id: z.string(),
	uri: z.string(),
	name: z.string(),
	artistName: z.string(),
	albumImage: z.string().optional(),
	duration: z.number(),
});

export const getSongRecommendationsDto = createInfiniteDataDto({ defaultLimit: 10 })
	.and(infiniteDataOrderDto)
	.and(
		z.object({
			filter: z.enum(['unlistened', 'listened']).optional(),
		}),
	);

export const updateSongRecommendationDto = z
	.object({
		listened: z.boolean(),
		rating: z.number().min(0).max(10),
		comments: z.string(),
	})
	.partial();

export type CreateSongRecommendationDto = z.infer<typeof createSongRecommendationDto>;
export type GetSongRecommendationsDto = z.infer<typeof getSongRecommendationsDto>;
export type UpdateSongRecommendationDto = z.infer<typeof updateSongRecommendationDto>;
