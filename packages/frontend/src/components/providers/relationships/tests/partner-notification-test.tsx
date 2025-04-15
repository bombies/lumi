'use client';

import { FC } from 'react';

import { Button } from '@/components/ui/button';
import { useRelationship } from '../relationship-provder';

const PartnerNotificationTest: FC = () => {
	const { sendNotificationToPartner } = useRelationship();
	return (
		<Button
			onClick={async () => {
				await sendNotificationToPartner({
					title: 'Test Notification',
					content: 'Hello there',
				});
			}}
		>
			Send Partner Notificiation
		</Button>
	);
};

export default PartnerNotificationTest;
