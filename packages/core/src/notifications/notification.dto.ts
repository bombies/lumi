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

export const unreadNotificationCountSchema = z.object({
	userId: z.string(),
	count: z.number().int(),
});

export const createNotificationDto = notificationSchema.pick({ title: true, content: true, openUrl: true }).and(
	z.object({
		read: z.boolean().optional(),
	}),
);

export const getNotificationsDto = createInfiniteDataDto({ defaultLimit: 10 });
export const getFilteredNotificationsDto = getNotificationsDto.and(
	z.object({
		filter: z.enum(['read', 'unread']),
	}),
);

export const updateNotificationDto = notificationSchema.pick({ read: true }).partial();

export type CreateNotificationDto = z.infer<typeof createNotificationDto>;
export type GetNotificationsDto = z.infer<typeof getNotificationsDto>;
export type GetFilteredNotificationsDto = z.infer<typeof getFilteredNotificationsDto>;
export type UpdateNotificationDto = z.infer<typeof updateNotificationDto>;
