'use client';

import type { StoredNotification } from '@lumi/core/notifications/notification.types';
import type { FC } from 'react';
import { EnvelopeIcon } from '@heroicons/react/24/solid';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useManagedTableGlobals } from '@/components/ui/table/managed-table-provider';
import { MarkAllNotificationsAsRead, MarkNotificationsAsRead } from '@/hooks/trpc/notification-hooks';
import NotificationVisitButton from './notification-visit-button';

const SelectedNotificationsFloater: FC = () => {
	const { mutateAsync: markNotificationsAsRead, isPending: isMarkingNotificationsAsRead } = MarkNotificationsAsRead();
	const { mutateAsync: markAllNotificationsAsRead, isPending: isMarkingAllNotificationsAsRead }
		= MarkAllNotificationsAsRead();

	const [element, setElement] = useState<HTMLDivElement | null>();
	const { table } = useManagedTableGlobals<StoredNotification>();
	const selectedItems = table.getSelectedRowModel().flatRows;
	const allItemsSelected = table.getIsAllRowsSelected();

	return (
		<div ref={setElement}>
			{element
				&& createPortal(
					<AnimatePresence mode="wait">
						{selectedItems.length
							? (
									<motion.div
										initial={{
											bottom: -100,
										}}
										animate={{
											bottom: 0,
										}}
										exit={{
											bottom: -100,
										}}
										className="fixed h-fit tablet:h-16 w-screen bottom-0 z-50 bg-background/80 backdrop-blur-md p-4 border border-border flex justify-center items-center"
									>
										<div className="w-full laptop:max-w-[35rem] flex justify-between items-center gap-x-8">
											<p>
												You have selected
												{' '}
												<span className="text-primary">
													{allItemsSelected ? 'all' : selectedItems.length}
												</span>
												{' '}
												items.
											</p>
											<div className="flex gap-2">
												<Button
													loading={isMarkingNotificationsAsRead || isMarkingAllNotificationsAsRead}
													onClick={async () => {
														toast.promise(
															allItemsSelected
																? markAllNotificationsAsRead()
																: markNotificationsAsRead(
																		selectedItems.map(item => ({
																			id: item.original.id,
																			createdAt: item.original.createdAt,
																		})),
																	),
															{
																loading: 'Marking notifications as read...',
																success: 'Marked those notifications as read!',
																error: 'Could not mark those notifications as read!',
															},
														);
													}}
												>
													<EnvelopeIcon />
													{' '}
													Mark as read
												</Button>
												{selectedItems.length === 1 && selectedItems[0].original.openUrl && (
													<NotificationVisitButton
														notification={selectedItems[0].original}
														disabled={
															isMarkingNotificationsAsRead || isMarkingAllNotificationsAsRead
														}
														variant="accent"
													/>
												)}
											</div>
										</div>
									</motion.div>
								)
							: undefined}
					</AnimatePresence>,
					document.body,
				)}
		</div>
	);
};

export default SelectedNotificationsFloater;
