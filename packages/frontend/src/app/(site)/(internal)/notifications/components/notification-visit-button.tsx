'use client';

import type { StoredNotification } from '@lumi/core/notifications/notification.types';
import type { VariantProps } from 'class-variance-authority';
import type { FC } from 'react';
import type { buttonVariants } from '@/components/ui/button';
import { LinkIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { UpdateNotification } from '@/hooks/trpc/notification-hooks';

type Props = {
	notification: StoredNotification;
	disabled?: boolean;
	iconOnly?: boolean;
	variant?: VariantProps<typeof buttonVariants>['variant'];
};

const NotificationVisitButton: FC<Props> = ({ notification, disabled, iconOnly, variant }) => {
	const { mutateAsync: updateNotification } = UpdateNotification();

	return (
		notification.openUrl && (
			<Link href={notification.openUrl}>
				<Button
					variant={variant}
					disabled={disabled}
					onClick={async () => {
						if (notification.read) return;

						await updateNotification({
							notificationId: notification.id,
							read: true,
						});
					}}
				>
					<LinkIcon />
					{' '}
					{!iconOnly ? 'Visit' : ''}
				</Button>
			</Link>
		)
	);
};

export default NotificationVisitButton;
