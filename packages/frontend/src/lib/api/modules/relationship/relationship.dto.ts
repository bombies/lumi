import z4 from 'zod/v4';
import { getInfiniteDataSchema } from '@/lib/api/types/dto.types';

export const createRelationshipRequestSchema = z4.object({
	senderId: z4.uuid(),
	receiverId: z4.uuid(),
});

export const getRelationshipRequestForUserSchema = getInfiniteDataSchema();

export const updateRelationshipSchema = z4.object({
	anniversary: z4.iso.datetime(),
}).partial();

export type CreateRelationshipRequestDto = z4.infer<typeof createRelationshipRequestSchema>;
export type GetRelationshipRequestForUserDto = z4.infer<typeof getRelationshipRequestForUserSchema>;
export type UpdateRelationshipDto = z4.infer<typeof updateRelationshipSchema>;
