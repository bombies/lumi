import { z } from 'zod';

import { createInfiniteDataDto } from '../types/infinite-data.dto';

export const createRelationshipRequestDto = z.object({
	senderId: z.string().uuid(),
	receiverId: z.string().uuid(),
});

export const getRelationshipRequestsForUserDto = createInfiniteDataDto({
	defaultLimit: 50,
}).and(
	z.object({
		userId: z.string().uuid(),
	}),
);

export type CreateRelationshipRequestDto = z.infer<typeof createRelationshipRequestDto>;
export type GetRelationshipRequestsForUserDto = z.infer<typeof getRelationshipRequestsForUserDto>;
