'use client';

import { FC, useCallback, useState } from 'react';
import Link from 'next/link';
import { EyeIcon, InboxArrowDownIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { StoredNotification } from '@lumi/core/types/notification.types';
import { getRelativeTime } from '@lumi/core/utils/global-utils';
import { SwipeableList, SwipeableListItem, SwipeAction, TrailingActions, Type } from 'react-swipeable-list';

import { UpdateNotification } from '@/hooks/trpc/notification-hooks';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';

import 'react-swipeable-list/dist/styles.css';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { useIsTablet } from '@/lib/hooks/useScreenSizes';

type Props = {
	notification: StoredNotification;
};

const NotificationPreview: FC<Props> = ({ notification }) => {
	const isTablet = useIsTablet();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [swipeVisible, setSwipeVisible] = useState(false);
	const { mutateAsync: updateNotification, isPending: isUpdating } = UpdateNotification();
	const router = useRouter();

	const updateReadStatus = useCallback(async () => {
		await updateNotification({ notificationId: notification.id, read: !notification.read });
	}, [notification.id, notification.read, updateNotification]);

	return (
		<>
			<SwipeableList type={Type.IOS} fullSwipe>
				<SwipeableListItem
					blockSwipe={!isTablet}
					onSwipeProgress={progress => {
						setSwipeVisible(progress ? true : false);
					}}
					trailingActions={
						<TrailingActions>
							{notification.openUrl && (
								<SwipeAction
									onClick={async () => {
										setSwipeVisible(false);
										toast.info('Viewing notification...');
										if (!notification.read) await updateReadStatus();
										router.push(notification.openUrl!);
									}}
									Tag="div"
								>
									<div className="w-full h-full bg-accent flex items-center px-2">
										<EyeIcon className="size-[18px]" />
									</div>
								</SwipeAction>
							)}
							<SwipeAction
								onClick={() => {
									setSwipeVisible(false);
									toast.promise(updateReadStatus(), {
										loading: 'Updating notification status...',
										success: 'Updated notification status!',
										error: 'Failed to update notification status.',
									});
								}}
								Tag="div"
							>
								<div className="w-full h-full bg-primary flex items-center px-2 rounded-r-md">
									<InboxArrowDownIcon className="size-[18px]" />
								</div>
							</SwipeAction>
						</TrailingActions>
					}
				>
					<button
						onClick={() => {
							if (isTablet) return;
							setDialogOpen(true);
						}}
						className={cn(
							'flex items-center gap-1 rounded-md px-2 py-4 justify-between hover:bg-secondary/20 cursor-pointer w-full',
							!notification.read && 'bg-primary/10 hover:bg-primary/60 border border-primary/20',
							swipeVisible && 'rounded-r-none',
						)}
					>
						<div className="w-[75%] flex gap-1">
							{!notification.read && <SparklesIcon className="size-[18px] text-accent shrink-0" />}
							<div className="w-full">
								{notification.title && (
									<h3 className="font-semibold text-xs text-left text-primary">
										{notification.title}
									</h3>
								)}
								<p className="w-full text-nowrap overflow-hidden overflow-ellipsis text-left">
									{notification.content}
								</p>
							</div>
						</div>
						<p className="text-xs shrink-0">{getRelativeTime(new Date(notification.createdAt))}</p>
					</button>
				</SwipeableListItem>
			</SwipeableList>
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{notification.title}</DialogTitle>
					</DialogHeader>
					<p className="whitespace-pre-wrap">{notification.content}</p>
					<DialogFooter>
						<Button onClick={updateReadStatus} loading={isUpdating}>
							<InboxArrowDownIcon className="size-[18px]" /> Mark As{' '}
							{notification.read ? 'Unread' : 'Read'}
						</Button>
						{notification.openUrl && (
							<Link href={notification.openUrl}>
								<Button
									variant="accent"
									onClick={async () => {
										setDialogOpen(false);
										if (!notification.read) await updateReadStatus();
									}}
								>
									<EyeIcon className="size-[18px]" /> View
								</Button>
							</Link>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default NotificationPreview;
