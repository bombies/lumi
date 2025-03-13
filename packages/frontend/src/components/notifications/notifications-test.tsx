'use client';

import { FC } from 'react';

import { GetSelfUser } from '@/app/(site)/(internal)/settings/(account)/trpc-hooks';
import { useNotifications } from '@/components/notifications/notifications-provider';
import { Button } from '@/components/ui/button';

const NotificationsTest: FC = () => {
	const { data: user } = GetSelfUser();
	const { subscription, subscribe, sendNotification, unsubscribe, browserAllowsNotifications } = useNotifications();

	return (
		browserAllowsNotifications && (
			<div>
				{subscription ? (
					<>
						<Button onClick={unsubscribe}>Unsubscribe from notifications</Button>
						<Button
							onClick={() => {
								if (!user) return;
								sendNotification({
									message: 'This is a test notification',
									title: 'Test notification',
								});
							}}
						>
							Send test notification
						</Button>
					</>
				) : (
					<Button onClick={subscribe}>Subscribe to notifications</Button>
				)}
			</div>
		)
	);
};

export default NotificationsTest;
