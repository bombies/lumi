import { z } from 'zod';

import { createInfiniteDataDto } from '../types/infinite-data.dto';

export const createRelationshipRequestDto = z.object({
	senderId: z.string(),
	receiverId: z.string(),
});

export const getRelationshipRequestsForUserDto = createInfiniteDataDto({
	defaultLimit: 50,
}).and(
	z.object({
		userId: z.string(),
	}),
);

export const updateRelationshipDto = z.object({
	anniversary: z.iso.datetime(),
}).partial();

export type CreateRelationshipRequestDto = z.infer<typeof createRelationshipRequestDto>;
export type GetRelationshipRequestsForUserDto = z.infer<typeof getRelationshipRequestsForUserDto>;
export type UpdateRelationshipDto = z.infer<typeof updateRelationshipDto>;
