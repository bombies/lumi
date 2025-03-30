import { z } from 'zod';

import { createInfiniteDataDto } from '../types/infinite-data.dto';

export const notificationSchema = z.object({
	id: z.string().uuid(),
	userId: z.string(),
	title: z.string().optional(),
	content: z.string(),
	createdAt: z.string().datetime(),
	read: z.boolean(),
	openUrl: z.string().optional(),
});

export const createNotificationDto = notificationSchema.pick({ title: true, content: true, openUrl: true });

export const getNotificationsDto = createInfiniteDataDto({ defaultLimit: 10 });
export const getFilteredNotificationsDto = getNotificationsDto.and(
	z.object({
		filter: z.enum(['read', 'unread']),
	}),
);

export type CreateNotificationDto = z.infer<typeof createNotificationDto>;
export type GetNotificationsDto = z.infer<typeof getNotificationsDto>;
export type GetFilteredNotificationsDto = z.infer<typeof getFilteredNotificationsDto>;
