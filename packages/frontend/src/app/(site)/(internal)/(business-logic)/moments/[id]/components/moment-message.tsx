'use client';

import type { MomentMessage } from '@lumi/core/moments/moment.types';
import type { DeepPartial } from '@lumi/core/utils/utils';
import type { WebSocketEventHandler } from '@lumi/core/websockets/websockets.types';
import type { FC } from 'react';

import { useRelationship } from '@/components/providers/relationships/relationship-provder';
import { WebsocketTopic } from '@/components/providers/web-sockets/topics';
import { useWebSocket } from '@/components/providers/web-sockets/web-socket-provider';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { EmojiPicker, EmojiPickerContent, EmojiPickerEmoji, EmojiPickerSearch } from '@/components/ui/emoji-picker';
import { DeleteMomentMessage, SetMomentMessageReaction } from '@/hooks/trpc/moment-hooks';
import { logger } from '@/lib/logger';
import { handleTrpcError } from '@/lib/trpc/utils';
import { cn } from '@/lib/utils';
import { FaceSmileIcon, TrashIcon } from '@heroicons/react/24/solid';
import { formatTime } from '@lumi/core/utils/global-utils';
import { deepMerge } from '@lumi/core/utils/utils';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Props = {
	message: MomentMessage;
};

const MomentMessageElement: FC<Props> = ({ message }) => {
	const { mutateAsync: addMomentReaction } = SetMomentMessageReaction();
	const { mutateAsync: deleteMomentMessage } = DeleteMomentMessage();

	const { self, partner, relationship } = useRelationship();
	const { emitEvent, addEventHandler, removeEventHandler } = useWebSocket();
	const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
	const [optimisticMessage, setOptimisticMessage] = useState(message);

	const messageUser = useMemo(() => (message.senderId === self.id ? self : partner), [message, partner, self]);
	const userIsSelf = useMemo(() => messageUser.id === self.id, [messageUser, self]);

	const updateMessage = useCallback((message: DeepPartial<MomentMessage>) => {
		setOptimisticMessage((prev) => {
			return deepMerge(prev, message);
		});
	}, []);

	const addReaction = useCallback(async (reaction: string) => {
		const oldMsg = optimisticMessage;
		updateMessage({ reaction });

		try {
			await addMomentReaction({
				messageId: message.id,
				reaction,
			});

			emitEvent('momentMessageReact', {
				senderId: self.id,
				messageId: message.id,
				reaction,
				timestamp: new Date().toISOString(),
			}, {
				topic: WebsocketTopic.momentChatTopic(relationship.id, message.momentId),
			});
		} catch (e) {
			updateMessage(oldMsg);
			handleTrpcError(e);
		}
	}, [addMomentReaction, emitEvent, message.id, message.momentId, optimisticMessage, relationship.id, self.id, updateMessage]);

	const deleteMessage = useCallback(async () => {
		const oldMsg = optimisticMessage;
		updateMessage({ content: '[deleted]', isDeleted: true });

		try {
			await deleteMomentMessage(message.id);

			emitEvent('momentMessageDelete', {
				senderId: self.id,
				messageId: message.id,
				timestamp: new Date().toISOString(),
			}, {
				topic: WebsocketTopic.momentChatTopic(relationship.id, message.momentId),
			});
		} catch (e) {
			updateMessage(oldMsg);
			handleTrpcError(e);
		}
	}, [deleteMomentMessage, emitEvent, message.id, message.momentId, optimisticMessage, relationship.id, self.id, updateMessage]);

	// Websocket listeners
	useEffect(() => {
		const reactionAddHandler: WebSocketEventHandler<'momentMessageReact'> = (payload) => {
			if (payload.messageId === message.id) {
				updateMessage({ reaction: payload.reaction });
			}
		};

		const messageDeletionHandler: WebSocketEventHandler<'momentMessageDelete'> = (payload) => {
			if (payload.messageId === message.id) {
				updateMessage({ content: '[deleted]', isDeleted: true });
			}
		};

		addEventHandler('momentMessageReact', reactionAddHandler);
		addEventHandler('momentMessageDelete', messageDeletionHandler);

		return () => {
			removeEventHandler('momentMessageReact', reactionAddHandler);
			removeEventHandler('momentMessageDelete', messageDeletionHandler);
		};
	}, [addEventHandler, message.id, removeEventHandler, updateMessage]);

	return (
		<ContextMenu>
			<ContextMenuTrigger disabled={userIsSelf && optimisticMessage.isDeleted} asChild>
				<div className={cn(
					'relative self-end',
					!userIsSelf && 'self-start',
				)}
				>
					<button
						type="button"
						id={message.id}
						className={cn(
							'flex text-left rounded-md bg-primary px-3 py-1 w-fit max-w-full break-words gap-2',
							!userIsSelf && 'bg-secondary',
						)}
					>
						<p className={cn(
							'text-white whitespace-pre-wrap flex gap-1 items-center',
							optimisticMessage.isDeleted && 'text-white/50 italic',
						)}
						>
							{optimisticMessage.isDeleted && <span><TrashIcon className="size-[18px]" /></span>}
							{optimisticMessage.content}
						</p>
						<p className={cn('text-[10px] phone:text-[8px] shrink-0 w-fit text-white/20 text-right self-end')}>
							{formatTime(new Date(message.timestamp), {
								noDate: true,
							})}
						</p>
					</button>
					<AnimatePresence>
						{optimisticMessage.reaction && (
							<motion.div
								initial={{ opacity: 0, scale: 0.5 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.5 }}
								transition={{ duration: 0.2 }}
								className="absolute -top-5 -right-5"
							>
								<p className="text-[12px] border border-border bg-background rounded-full px-2 py-1 shrink-0 cursor-none w-fittext-right self-end">
									{optimisticMessage.reaction}
								</p>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</ContextMenuTrigger>
			<ContextMenuContent>
				{userIsSelf
					? (
							<>
								<ContextMenuItem variant="destructive" onClick={deleteMessage}>
									<TrashIcon className="size-[18px]" />
									{' '}
									Delete
								</ContextMenuItem>
							</>
						)
					: (
							<>
								<ContextMenuSub open={reactionPickerOpen} onOpenChange={setReactionPickerOpen}>
									<ContextMenuSubTrigger>
										<FaceSmileIcon className="size-[18px] text-current mr-2" />
										{' '}
										React
									</ContextMenuSubTrigger>
									<ContextMenuSubContent asChild className="size-56">
										<EmojiPicker onEmojiSelect={async ({ emoji }) => {
											logger.debug('Selected: ', emoji);
											setReactionPickerOpen(false);
											await addReaction(emoji);
										}}
										>
											<EmojiPickerSearch />
											<EmojiPickerContent Emoji={({ ...props }) => (
												<ContextMenuItem className="w-fit" asChild>
													<EmojiPickerEmoji {...props} />
												</ContextMenuItem>
											)}
											/>
										</EmojiPicker>
									</ContextMenuSubContent>
								</ContextMenuSub>
							</>
						)}
			</ContextMenuContent>
		</ContextMenu>
	);
};

export default MomentMessageElement;
