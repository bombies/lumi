import { z } from 'zod';

import { createInfiniteDataDto, infiniteDataOrderDto } from '../types/infinite-data.dto';

export const affirmationSchema = z.object({
	id: z.string().uuid(),
	affirmation: z.string().min(1).max(150),
	selectedCount: z.number().positive(),
	relationshipId: z.string().uuid(),
	ownerId: z.string(),
});

export const receivedAffirmationSchema = z.object({
	affirmation: z.string().min(1).max(150),
	timestamp: z.string().datetime(),
});

export const createAffirmationDto = z.object({
	relationshipId: z.string().uuid(),
	ownerId: z.string(),
	affirmation: z.string().min(1).max(150),
});

export const updateAffirmationDto = affirmationSchema.partial().omit({
	id: true,
	relationshipId: true,
	ownerId: true,
});

export const getReceivedAffirmationsDto = createInfiniteDataDto({
	defaultLimit: 50,
}).and(infiniteDataOrderDto.partial());

export type CreateAffirmationDto = z.infer<typeof createAffirmationDto>;
export type UpdateAffirmationDto = z.infer<typeof updateAffirmationDto>;
export type GetReceivedAffirmationsDto = z.infer<typeof getReceivedAffirmationsDto>;
