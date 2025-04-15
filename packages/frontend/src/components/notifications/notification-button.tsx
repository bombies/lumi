'use client';

import { FC, useMemo } from 'react';
import Link from 'next/link';
import { CheckIcon, InboxIcon } from '@heroicons/react/24/solid';
import { BellIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
	GetNotifications,
	GetUnreadNotificationCount,
	MarkAllNotificationsAsRead,
} from '@/hooks/trpc/notification-hooks';
import { Separator } from '../ui/separator';
import NotificationPreview from './notification-preview';
import NotificationPreviewSkeleton from './notification-preview-skeleton';

const NotificationButton: FC = () => {
	const { data: notificationPages, isLoading: pagesLoading } = GetNotifications({ limit: 10, filter: 'unread' });
	const { data: unreadNotificationCount } = GetUnreadNotificationCount();
	const { mutateAsync: markAllNotifsAsRead, isPending: isMarkingAllAsRead } = MarkAllNotificationsAsRead();

	const notificationPreviews = useMemo(
		() =>
			notificationPages?.pages.flatMap(page =>
				page?.data?.map(notif => (
					<>
						<NotificationPreview key={notif.id} notification={notif} />
						<Separator />
					</>
				)),
			),
		[notificationPages?.pages],
	);

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button size="icon" variant="ghost" className="relative">
					<BellIcon size={18} />
					{unreadNotificationCount?.count ? (
						<div className="absolute top-0 right-0 rounded-full size-[18px] bg-destructive text-primary-foreground text-xs flex justify-center items-center">
							{unreadNotificationCount?.count > 99 ? '99+' : unreadNotificationCount?.count}
						</div>
					) : undefined}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-96 max-h-[50vh] laptop:max-h-[35rem] flex flex-col gap-y-2">
				<h1 className="font-bold text-xl">Notifications</h1>
				<Separator />
				<div className="overflow-y-auto space-y-2">
					{pagesLoading ? (
						<>
							<NotificationPreviewSkeleton />
							<NotificationPreviewSkeleton />
							<NotificationPreviewSkeleton />
							<NotificationPreviewSkeleton />
							<NotificationPreviewSkeleton />
							<NotificationPreviewSkeleton />
							<NotificationPreviewSkeleton />
							<NotificationPreviewSkeleton />
							<NotificationPreviewSkeleton />
							<NotificationPreviewSkeleton />
						</>
					) : notificationPreviews?.length ? (
						<>
							{notificationPreviews}
							<Button
								className="w-full h-10"
								variant="default:flat"
								loading={isMarkingAllAsRead}
								onClick={() => {
									toast.promise(markAllNotifsAsRead(), {
										loading: 'Marking all notifications as read...',
										success: 'Successfully marked all notifications as read!',
										error: 'Could not mark all notifications as read.',
									});
								}}
							>
								<CheckIcon /> Mark All as Read
							</Button>
						</>
					) : (
						<p>You have no new notifications.</p>
					)}
					<Link href="/notifications">
						<Button className="w-full h-10" variant="default:flat" disabled={isMarkingAllAsRead}>
							<InboxIcon /> View All Notifications
						</Button>
					</Link>
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default NotificationButton;
