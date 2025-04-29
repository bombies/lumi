'use client';

import type { FC } from 'react';

import { useNotifications } from '@/components/notifications/notifications-provider';
import { Button } from '@/components/ui/button';
import { GetSelfUser } from '@/hooks/trpc/user-hooks';

const NotificationsTest: FC = () => {
	const { data: user } = GetSelfUser();
	const { subscription, subscribe, sendNotification, unsubscribe, browserAllowsNotifications } = useNotifications();

	return (
		browserAllowsNotifications && (
			<div>
				{subscription
					? (
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
						)
					: (
							<Button onClick={subscribe}>Subscribe to notifications</Button>
						)}
			</div>
		)
	);
};

export default NotificationsTest;
