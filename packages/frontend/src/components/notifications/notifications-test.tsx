'use client';

import { FC } from 'react';

import { useNotifications } from '@/components/notifications/notifications-provider';
import { Button } from '@/components/ui/button';

const NotificationsTest: FC = () => {
	const { subscription, subscribe, sendNotification, unsubscribe } = useNotifications();

	return (
		<div>
			{subscription ? (
				<>
					<Button onClick={unsubscribe}>Unsubscribe from notifications</Button>
					<Button
						onClick={() =>
							sendNotification({
								message: 'This is a test notification',
								title: 'Test notification',
							})
						}
					>
						Send test notification
					</Button>
				</>
			) : (
				<Button onClick={subscribe}>Subscribe to notifications</Button>
			)}
		</div>
	);
};

export default NotificationsTest;
