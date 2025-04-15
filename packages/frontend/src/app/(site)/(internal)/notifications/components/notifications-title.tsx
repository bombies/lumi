'use client';

import { FC } from 'react';

import { Badge } from '@/components/ui/badge';
import Spinner from '@/components/ui/spinner';
import Title from '@/components/ui/title';
import { useNotificationsView } from './notifications-view-provider';

const NotificationsTitle: FC = () => {
	const {
		data: { unreadCount, unreadCountLoading },
	} = useNotificationsView();
	return (
		<Title className="flex flex-wrap break-words items-center gap-4">
			Notifications{' '}
			<Badge variant="outline">{unreadCountLoading ? <Spinner size={10} /> : (unreadCount ?? '0')} Unread</Badge>
		</Title>
	);
};

export default NotificationsTitle;
