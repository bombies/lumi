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
	momentId: z.string().uuid(),
	content: z.string().min(0).max(1024),
	repliedTo: z.string().uuid().optional(),
});

export const createMomentDetailsDto = momentSchema.omit({ normalizedTitle: true });
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

export const createMomentMessageDto = momentMessageSchema
	.omit({
		senderId: true,
	})
	.and(
		z.object({
			timestamp: z.string().datetime().optional(),
		}),
	);

export const getMomentUploadUrlDto = getUploadUrlDto;

export const searchMomentsByTitleDto = getInfiniteMomentsDto.and(
	z.object({
		title: z.string(),
	}),
);

export type CreateMomentDetailsDto = z.infer<typeof createMomentDetailsDto>;
export type GetInfiniteMomentsDto = z.infer<typeof getInfiniteMomentsDto>;
export type UpdateMomentDetailsDto = z.infer<typeof updateMomentDetailsDto>;
export type CreateMomentMessageDto = z.infer<typeof createMomentMessageDto>;
export type GetInfiniteMomentMessagesDto = z.infer<typeof getInfiniteMomentMessagesDto>;
export type GetMomentUploadUrlDto = z.infer<typeof getMomentUploadUrlDto>;
export type SearchMomentsByTitleDto = z.infer<typeof searchMomentsByTitleDto>;
