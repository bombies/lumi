'use client';

import type { StoredNotification } from '@lumi/core/notifications/notification.types';
import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { UpdateNotification } from '@/hooks/trpc/notification-hooks';
import { EnvelopeIcon, EnvelopeOpenIcon } from '@heroicons/react/24/solid';

import { useCallback } from 'react';
import { toast } from 'sonner';

type Props = {
	notification: StoredNotification;
};

const NotificationReadToggle: FC<Props> = ({ notification }) => {
	const { mutateAsync: updateNotification, isPending: isUpdating } = UpdateNotification();

	const updateReadStatus = useCallback(() => {
		toast.promise(updateNotification({ notificationId: notification.id, read: !notification.read }), {
			loading: 'Updating notification status...',
			success: 'Updated notification status!',
			error: 'Could not update notification status!',
		});
	}, [notification.id, notification.read, updateNotification]);

	return (
		<Button
			size="icon"
			variant="default:flat"
			loading={isUpdating}
			tooltip={notification.read ? 'Mark as unread' : 'Mark as read'}
			onClick={updateReadStatus}
		>
			{notification.read ? <EnvelopeIcon /> : <EnvelopeOpenIcon />}
		</Button>
	);
};

export default NotificationReadToggle;
