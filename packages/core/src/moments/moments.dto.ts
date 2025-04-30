import { z } from 'zod';

import { createInfiniteDataDto, infiniteDataOrderDtoWithDefault } from '../types/infinite-data.dto';
import { getUploadUrlDto } from '../types/upload.dto';

export const momentSchema = z.object({
	title: z.string().min(0).max(90),
	normalizedTitle: z.string(),
	description: z.string().min(0).max(1024).optional(),
	objectKey: z.string(),
	thumbnailObjectKey: z.string().optional(),
});

export const momentMessageSchema = z.object({
	senderId: z.string(),
	momentId: z.uuid(),
	content: z.string().min(0).max(1024),
	repliedTo: z.uuid().optional(),
});

export const createMomentDetailsDto = momentSchema.omit({ normalizedTitle: true }).and(
	z.object({
		tags: z.array(z.string()).optional(),
	}),
);
export const updateMomentDetailsDto = momentSchema
	.omit({
		objectKey: true,
	})
	.partial()
	.and(
		z.object({
			tags: z.array(z.string()).optional(),
		}),
	);

export const getInfiniteMomentsDto = createInfiniteDataDto({
	defaultLimit: 10,
}).and(infiniteDataOrderDtoWithDefault('desc'));

export const getInfiniteMomentMessagesDto = createInfiniteDataDto({
	defaultLimit: 50,
})
	.and(infiniteDataOrderDtoWithDefault('desc'))
	.and(
		z.object({
			momentId: z.uuid(),
		}),
	);

export const createMomentMessageDto = momentMessageSchema
	.omit({
		senderId: true,
	})
	.and(
		z.object({
			timestamp: z.iso.datetime().optional(),
			id: z.uuid().optional(),
		}),
	);

export const setMomentMessageReactionDto = z.object({
	messageId: z.uuid(),
	reaction: z.emoji(),
});

export const getMomentUploadUrlDto = getUploadUrlDto;

export const searchMomentsDto = createInfiniteDataDto({
	defaultLimit: 10,
})
	.omit({
		cursor: true,
	})
	.and(infiniteDataOrderDtoWithDefault('desc'))
	.and(
		z.object({
			query: z.string(),
			cursor: z.array(z.record(z.string(), z.any()).or(z.null())).optional(),
		}),
	);

export const getRelationshipMomentTagsDto = createInfiniteDataDto({ defaultLimit: 10 }).and(
	z.object({
		query: z.string().optional(),
	}),
);

export const createRelationshipMomentTagDto = z.object({
	tag: z.string().min(1).max(50),
});

export const createMomentTagDto = z.object({
	momentId: z.uuid(),
	tag: z.string().min(1).max(50),
});

export const getMomentsByTagDto = createInfiniteDataDto({ defaultLimit: 10 })
	.and(infiniteDataOrderDtoWithDefault('desc'))
	.and(
		z.object({
			tagQuery: z.string(),
		}),
	);

export const deleteMomentTagDto = z.object({
	momentId: z.uuid(),
	tag: z.string().min(1).max(50),
});

export type CreateMomentDetailsDto = z.infer<typeof createMomentDetailsDto>;
export type GetInfiniteMomentsDto = z.infer<typeof getInfiniteMomentsDto>;
export type UpdateMomentDetailsDto = z.infer<typeof updateMomentDetailsDto>;
export type CreateMomentMessageDto = z.infer<typeof createMomentMessageDto>;
export type GetInfiniteMomentMessagesDto = z.infer<typeof getInfiniteMomentMessagesDto>;
export type GetMomentUploadUrlDto = z.infer<typeof getMomentUploadUrlDto>;
export type SearchMomentsDto = z.infer<typeof searchMomentsDto>;
export type GetRelationshipMomentTagsDto = z.infer<typeof getRelationshipMomentTagsDto>;
export type CreateRelationshipMomentTagDto = z.infer<typeof createRelationshipMomentTagDto>;
export type CreateMomentTagDto = z.infer<typeof createMomentTagDto>;
export type GetMomentsByTagDto = z.infer<typeof getMomentsByTagDto>;
export type DeleteMomentTagDto = z.infer<typeof deleteMomentTagDto>;
export type SetMomentMessageReactionDto = z.infer<typeof setMomentMessageReactionDto>;
