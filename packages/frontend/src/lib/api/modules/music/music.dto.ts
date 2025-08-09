import z4 from 'zod/v4';
import { getInfiniteDataSchema } from '@/lib/api/types/dto.types';

export const createSongRecommendationSchema = z4.object({
	id: z4.string(),
	uri: z4.string(),
	name: z4.string(),
	artistName: z4.string(),
	albumImage: z4.string().optional(),
	duration: z4.number(),
});

export const getSongRecommendationSchema = getInfiniteDataSchema({
	withOrder: true,
}).and(z4.object({
	filter: z4.enum(['listened', 'unlistened']),
}).partial());

export const updateSongRecommendationSchema = z4.object({
	listened: z4.boolean(),
	rating: z4.number(),
	comments: z4.string(),
}).partial();

export type CreateSongRecommendationDto = z4.infer<typeof createSongRecommendationSchema>;
export type GetSongRecommendationDto = z4.infer<typeof getSongRecommendationSchema>;
export type UpdateSongRecommendationDto = z4.infer<typeof updateSongRecommendationSchema>;
