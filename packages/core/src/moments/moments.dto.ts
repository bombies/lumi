import { z } from 'zod';

import { createInfiniteDataDto, infiniteDataOrderDtoWithDefault } from '../types/infinite-data.dto';

export const momentSchema = z.object({
	title: z.string().min(0).max(90),
	description: z.string().min(0).max(1024),
	objectKey: z.string(),
	thumbnailObjectKey: z.string().optional(),
});

export const momentMessageSchema = z.object({
	senderId: z.string().uuid(),
	momentId: z.string().uuid(),
	content: z.string().min(0).max(1024),
	repliedTo: z.string().uuid().optional(),
});

export const createMomentDetailsDto = momentSchema;
export const updateMomentDetailsDto = momentSchema
	.omit({
		objectKey: true,
	})
	.partial();

export const getInfiniteMomentsDto = createInfiniteDataDto({
	defaultLimit: 10,
}).and(infiniteDataOrderDtoWithDefault('desc'));

export const getInfiniteMomentMessagesDto = createInfiniteDataDto({
	defaultLimit: 50,
})
	.and(infiniteDataOrderDtoWithDefault('desc'))
	.and(
		z.object({
			momentId: z.string().uuid(),
		}),
	);

export const createMomentMessageDto = momentMessageSchema.omit({
	senderId: true,
});

export type CreateMomentDetailsDto = z.infer<typeof createMomentDetailsDto>;
export type GetInfiniteMomentsDto = z.infer<typeof getInfiniteMomentsDto>;
export type UpdateMomentDetailsDto = z.infer<typeof updateMomentDetailsDto>;
export type CreateMomentMessageDto = z.infer<typeof createMomentMessageDto>;
export type GetInfiniteMomentMessagesDto = z.infer<typeof getInfiniteMomentMessagesDto>;
