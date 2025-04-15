'use client';

import { useRouteInvalidation } from '@/lib/hooks/useRouteInvalidation';
import { trpc } from '@/lib/trpc/client';

export const GetNotifications = (opts?: { filter?: 'read' | 'unread'; limit?: number }) =>
	opts?.filter
		? trpc.notifications.getFilteredNotifications.useInfiniteQuery(
				{
					filter: opts.filter,
					limit: opts.limit,
				},
				{
					getNextPageParam: lastPage => lastPage.nextCursor,
				},
			)
		: trpc.notifications.getNotifications.useInfiniteQuery(
				{
					limit: opts?.limit,
				},
				{
					getNextPageParam: lastPage => lastPage.nextCursor,
				},
			);

export const StoreNotification = () => {
	const invalidateRoutes = useRouteInvalidation([
		trpc.notifications.getFilteredNotifications,
		trpc.notifications.getNotifications,
		trpc.notifications.getUnreadNotificationAggregate,
	]);
	return trpc.notifications.storeNotification.useMutation({
		async onSuccess() {
			await invalidateRoutes();
		},
	});
};

export const UpdateNotification = () => {
	const invalidateRoutes = useRouteInvalidation([
		trpc.notifications.getFilteredNotifications,
		trpc.notifications.getNotifications,
		trpc.notifications.getUnreadNotificationAggregate,
	]);
	return trpc.notifications.updateNotification.useMutation({
		async onSuccess() {
			await invalidateRoutes();
		},
	});
};

export const MarkNotificationsAsRead = () => {
	const invalidateRoutes = useRouteInvalidation([
		trpc.notifications.getFilteredNotifications,
		trpc.notifications.getNotifications,
		trpc.notifications.getUnreadNotificationAggregate,
	]);
	return trpc.notifications.markNotificationsAsRead.useMutation({
		async onSuccess() {
			await invalidateRoutes();
		},
	});
};

export const MarkAllNotificationsAsRead = () => {
	const invalidateRoutes = useRouteInvalidation([
		trpc.notifications.getFilteredNotifications,
		trpc.notifications.getNotifications,
		trpc.notifications.getUnreadNotificationAggregate,
	]);
	return trpc.notifications.markAllNotificationsAsRead.useMutation({
		async onSuccess() {
			await invalidateRoutes();
		},
	});
};

export const GetUnreadNotificationCount = () => trpc.notifications.getUnreadNotificationAggregate.useQuery();
