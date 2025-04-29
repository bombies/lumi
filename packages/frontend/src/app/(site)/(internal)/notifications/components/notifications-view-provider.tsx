'use client';

import type { StoredNotification } from '@lumi/core/notifications/notification.types';
import type { FC, PropsWithChildren } from 'react';
import { GetNotifications, GetUnreadNotificationCount } from '@/hooks/trpc/notification-hooks';

import { createContext, use, useMemo, useState } from 'react';

type NotificationsViewData = {
	filter: {
		currentFilter?: 'read' | 'unread';
		setFilter: (filter: 'read' | 'unread' | undefined) => void;
	};
	data: {
		notifications: StoredNotification[];
		isLoading: boolean;
		isRefetching: boolean;
		hasMore: boolean;
		loadMore: () => void;
		isLoadingMore: boolean;
		unreadCount?: number;
		unreadCountLoading?: boolean;
	};
};

const NotificationsViewContext = createContext<NotificationsViewData | undefined>(undefined);

export const useNotificationsView = () => {
	const context = use(NotificationsViewContext);
	if (!context) throw new Error('useNotificationsView must be used within a NotificationsViewProvider!');
	return context;
};

const NotificationsViewProvider: FC<PropsWithChildren> = ({ children }) => {
	const [filter, setFilter] = useState<'read' | 'unread'>();
	const {
		data: notificationPages,
		isLoading: notificationsLoading,
		hasNextPage: hasMoreNotifications,
		fetchNextPage: fetchMoreNotifications,
		isFetchingNextPage: moreNotificationsLoading,
		isRefetching: refetchingNotifications,
	} = GetNotifications({
		filter,
		limit: 10,
	});
	const { data: unreadCount, isLoading: unreadCountLoading } = GetUnreadNotificationCount();

	const memoizedValues = useMemo<NotificationsViewData>(
		() => ({
			filter: {
				currentFilter: filter,
				setFilter,
			},
			data: {
				notifications: notificationPages?.pages.flatMap(page => page.data) ?? [],
				isLoading: notificationsLoading,
				isRefetching: refetchingNotifications,
				hasMore: hasMoreNotifications,
				loadMore: fetchMoreNotifications,
				isLoadingMore: moreNotificationsLoading,
				unreadCount: unreadCount?.count ?? undefined,
				unreadCountLoading,
			},
		}),
		[
			fetchMoreNotifications,
			filter,
			hasMoreNotifications,
			moreNotificationsLoading,
			notificationPages?.pages,
			notificationsLoading,
			refetchingNotifications,
			unreadCount?.count,
			unreadCountLoading,
		],
	);

	return <NotificationsViewContext value={memoizedValues}>{children}</NotificationsViewContext>;
};

export default NotificationsViewProvider;
