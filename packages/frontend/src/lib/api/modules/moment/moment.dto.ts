import z4 from 'zod/v4';
import { MomentMessageState } from '@/lib/api/modules/moment/moment.model';
import { getInfiniteDataSchema } from '@/lib/api/types/dto.types';

export const createMomentDetailsSchema = z4.object({
	title: z4.string().min(1).max(90),
	description: z4.string().max(1024).optional(),
	objectKey: z4.string(),
	thumbnailObjectKey: z4.string().optional(),
	tags: z4.array(z4.string()).optional(),
});

export const updateMomentDetailsSchema = z4.object({
	title: z4.string().min(1).max(90),
	description: z4.string().max(1024),
	thumbnailObjectKey: z4.string(),
	tags: z4.array(z4.string()),
}).partial();

export const getInfiniteMomentsSchema = getInfiniteDataSchema({ withOrder: true })
	.and(z4.object({
		user: z4.string(),
		tag: z4.string(),
	}).partial());

export const getInfiniteMomentMessagesSchema = getInfiniteDataSchema({
	defaultLimit: 50,
	withOrder: true,
});

export const createMomentMessageSchema = z4.object({
	content: z4.string().min(1).max(1024),
});

export const updateMomentMessageSchema = z4.object({
	content: z4.string().min(1).max(1024),
	reaction: z4.emoji(),
	state: z4.enum(MomentMessageState),
}).partial();

export const searchMomentsSchema = getInfiniteDataSchema({
	withOrder: true,
}).and(z4.object({
	query: z4.string(),
	cursor: z4.array(z4.record(z4.string(), z4.any()).nullish()).nullish(),
}));

export const reactToMessageSchema = z4.object({
	reaction: z4.emoji(),
});

export const getRelationshipMomentTagsSchema = getInfiniteDataSchema()
	.and(z4.object({
		query: z4.string(),
	}));

export const createMomentTagSchema = z4.object({
	tag: z4.string().min(1).max(50),
});

export const getMomentsByTagSchema = getInfiniteDataSchema({
	withOrder: true,
}).and(z4.object({
	tagQuery: z4.string(),
}));

export const deleteMomentTagSchema = z4.object({
	momentId: z4.uuidv4(),
	tag: z4.string().min(1).max(50),
});

export type CreateMomentDetailsDto = z4.infer<typeof createMomentDetailsSchema>;
export type UpdateMomentDetailsDto = z4.infer<typeof updateMomentDetailsSchema>;
export type GetInfiniteMomentsDto = z4.infer<typeof getInfiniteMomentsSchema>;
export type GetInfiniteMomentMessagesDto = z4.infer<typeof getInfiniteMomentMessagesSchema>;
export type CreateMomentMessageDto = z4.infer<typeof createMomentMessageSchema>;
export type UpdateMomentMessageDto = z4.infer<typeof updateMomentMessageSchema>;
export type SearchMomentsDto = z4.infer<typeof searchMomentsSchema>;
export type ReactToMessageDto = z4.infer<typeof reactToMessageSchema>;
export type GetRelationshipMomentTagsDto = z4.infer<typeof getRelationshipMomentTagsSchema>;
export type CreateMomentTagDto = z4.infer<typeof createMomentTagSchema>;
export type GetMomentsByTagDto = z4.infer<typeof getMomentsByTagSchema>;
export type DeleteMomentTagDto = z4.infer<typeof deleteMomentTagSchema>;
