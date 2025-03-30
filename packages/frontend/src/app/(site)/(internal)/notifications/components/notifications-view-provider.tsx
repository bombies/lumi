'use client';

import { createContext, FC, PropsWithChildren, useContext, useMemo, useState } from 'react';
import { StoredNotification } from '@lumi/core/types/notification.types';

import { GetNotifications, GetUnreadNotificationCount } from '@/hooks/trpc/notification-hooks';

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
	};
};

const NotificationsViewContext = createContext<NotificationsViewData | undefined>(undefined);

export const useNotificationsView = () => {
	const context = useContext(NotificationsViewContext);
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
	const { data: unreadCount } = GetUnreadNotificationCount();

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
		],
	);

	return <NotificationsViewContext.Provider value={memoizedValues}>{children}</NotificationsViewContext.Provider>;
};

export default NotificationsViewProvider;
