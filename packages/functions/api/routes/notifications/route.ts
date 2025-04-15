import {
	createNotificationDto,
	getFilteredNotificationsDto,
	getNotificationsDto,
	updateNotificationDto,
} from '@lumi/core/notifications/notification.dto';
import {
	getFilteredStoredNotifications,
	getStoredNotifications,
	getUnreadNotificationCount,
	markAllNotificationsAsRead,
	markBulkNotificationsAsRead,
	storeNotification,
	updateNotification,
} from '@lumi/core/notifications/notifications.service';
import { z } from 'zod';

import { protectedProcedure, router } from '../../utils/trpc';

export const notificationsRouter = router({
	storeNotification: protectedProcedure
		.input(createNotificationDto)
		.mutation(({ input, ctx: { user } }) => storeNotification(user.id, input)),

	getNotifications: protectedProcedure
		.input(getNotificationsDto)
		.query(({ input, ctx: { user } }) => getStoredNotifications(user.id, input)),

	getFilteredNotifications: protectedProcedure
		.input(getFilteredNotificationsDto)
		.query(({ input, ctx: { user } }) => getFilteredStoredNotifications(user.id, input)),

	updateNotification: protectedProcedure
		.input(
			updateNotificationDto.and(
				z.object({
					notificationId: z.uuid(),
				}),
			),
		)
		.mutation(({ input: { notificationId, ...input }, ctx: { user } }) =>
			updateNotification(notificationId, input),
		),

	markAllNotificationsAsRead: protectedProcedure.mutation(({ ctx: { user } }) => markAllNotificationsAsRead(user.id)),

	markNotificationsAsRead: protectedProcedure
		.input(
			z.array(
				z.object({
					id: z.uuid(),
					createdAt: z.iso.datetime(),
				}),
			),
		)
		.mutation(({ input, ctx: { user } }) => markBulkNotificationsAsRead(user.id, input)),

	getUnreadNotificationAggregate: protectedProcedure.query(({ ctx: { user } }) =>
		getUnreadNotificationCount(user.id),
	),
});
