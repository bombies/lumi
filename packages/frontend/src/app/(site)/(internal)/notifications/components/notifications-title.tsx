'use client';

import { FC } from 'react';

import { Badge } from '@/components/ui/badge';
import Title from '@/components/ui/title';
import { useNotificationsView } from './notifications-view-provider';

const NotificationsTitle: FC = () => {
	const {
		data: { unreadCount },
	} = useNotificationsView();
	return (
		<Title className="flex items-center gap-4">
			Notifications <Badge variant="outline">{unreadCount ?? '?'} Unread</Badge>
		</Title>
	);
};

export default NotificationsTitle;
