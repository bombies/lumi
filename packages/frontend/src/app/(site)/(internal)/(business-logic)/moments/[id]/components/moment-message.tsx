'use client';

import type { MomentMessage } from '@lumi/core/moments/moment.types';
import type { DeepPartial } from '@lumi/core/utils/utils';
import type { WebSocketEventHandler } from '@lumi/core/websockets/websockets.types';
import type { FC } from 'react';

import { FaceSmileIcon, TrashIcon } from '@heroicons/react/24/solid';
import { formatTime } from '@lumi/core/utils/global-utils';
import { deepMerge } from '@lumi/core/utils/utils';
import { CheckCheckIcon, CheckIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMomentMessageGroupData } from '@/app/(site)/(internal)/(business-logic)/moments/[id]/components/moment-message-group-provider';
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
import { DeleteMomentMessage } from '@/hooks/trpc/moment-hooks';
import { logger } from '@/lib/logger';
import { handleTrpcError } from '@/lib/trpc/utils';
import { cn } from '@/lib/utils';

type Props = {
	message: MomentMessage;
};

const MomentMessageElement: FC<Props> = ({ message }) => {
	const { getScrollViewport } = useMomentMessageGroupData();
	const { mutateAsync: deleteMomentMessage } = DeleteMomentMessage();

	const { self, partner, relationship, sendNotificationToPartner } = useRelationship();
	const { emitEvent, addEventHandler, removeEventHandler } = useWebSocket();
	const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
	const [optimisticMessage, setOptimisticMessage] = useState(message);
	const msgRef = useRef<HTMLButtonElement>(null);

	const messageUser = useMemo(() => (message.senderId === self.id ? self : partner), [message, partner, self]);
	const selfOwnsMessage = useMemo(() => messageUser.id === self.id, [messageUser, self]);

	const updateMessage = useCallback((message: DeepPartial<MomentMessage>) => {
		setOptimisticMessage((prev) => {
			return deepMerge(prev, message);
		});
	}, []);

	const addReaction = useCallback(async (reaction: string) => {
		const oldMsg = optimisticMessage;
		updateMessage({ reaction });

		try {
			await emitEvent('momentMessageReact', {
				senderId: self.id,
				messageId: message.id,
				reaction,
				timestamp: new Date().toISOString(),
			}, {
				topic: WebsocketTopic.momentChatTopic(relationship.id, message.momentId),
			});

			await sendNotificationToPartner({
				content: `${reaction} reaction to: "${message.content}"`,
				title: `${self.firstName} Reacted to your moment message`,
				openUrl: `/moments/${message.momentId}`,
				metadata: {
					momentId: message.momentId,
				},
			});
		} catch (e) {
			updateMessage(oldMsg);
			handleTrpcError(e);
		}
	}, [emitEvent, message.content, message.id, message.momentId, optimisticMessage, relationship.id, self.firstName, self.id, sendNotificationToPartner, updateMessage]);

	const deleteMessage = useCallback(async () => {
		const oldMsg = optimisticMessage;
		updateMessage({ content: '[deleted]', isDeleted: true });

		try {
			await deleteMomentMessage(message.id);

			await emitEvent('momentMessageDelete', {
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
	}, [
		deleteMomentMessage,
		emitEvent,
		message.id,
		message.momentId,
		optimisticMessage,
		relationship.id,
		self.id,
		updateMessage,
	]);

	// eslint-disable-next-line unused-imports/no-unused-vars
	const editMessage = useCallback(async (newContent: string) => {
		const oldMsg = optimisticMessage;
		const updateTime = new Date().toISOString();
		updateMessage({ content: newContent, updatedAt: updateTime });

		try {
			await emitEvent('momentMessageStateUpdate', {
				senderId: self.id,
				messageId: message.id,
				content: newContent,
				timestamp: updateTime,
			});
		} catch (e) {
			updateMessage(oldMsg);
			handleTrpcError(e);
		}
	}, [emitEvent, message.id, optimisticMessage, self.id, updateMessage]);

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

		const stateUpdateHandler: WebSocketEventHandler<'momentMessageStateUpdate'> = (payload) => {
			if (payload.messageId === message.id) {
				updateMessage({ state: payload.state, content: payload.content, updatedAt: payload.timestamp });
			}
		};

		addEventHandler('momentMessageReact', reactionAddHandler);
		addEventHandler('momentMessageDelete', messageDeletionHandler);
		addEventHandler('momentMessageStateUpdate', stateUpdateHandler);

		return () => {
			removeEventHandler('momentMessageReact', reactionAddHandler);
			removeEventHandler('momentMessageDelete', messageDeletionHandler);
			removeEventHandler('momentMessageStateUpdate', stateUpdateHandler);
		};
	}, [addEventHandler, message.id, removeEventHandler, updateMessage]);

	// State Observer
	useEffect(() => {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach(async (entry) => {
				if (entry.isIntersecting && message.senderId !== self.id && optimisticMessage.state !== 'read') {
					await emitEvent('momentMessageStateUpdate', {
						senderId: self.id,
						messageId: message.id,
						state: 'read',
						timestamp: new Date().toISOString(),
					}, {
						topic: WebsocketTopic.momentChatTopic(relationship.id, message.momentId),
					});
				}
			});
		}, {
			threshold: 0.5,
			root: getScrollViewport(),
		});

		if (msgRef.current) observer.observe(msgRef.current);

		return () => {
			observer.disconnect();
		};
	}, [emitEvent, getScrollViewport, message.content, message.id, message.momentId, message.senderId, optimisticMessage.state, relationship.id, self.id]);

	return (
		<ContextMenu>
			<ContextMenuTrigger disabled={selfOwnsMessage && optimisticMessage.isDeleted} asChild>
				<div className={cn(
					'relative self-end',
					!selfOwnsMessage && 'self-start',
				)}
				>
					<button
						ref={msgRef}
						type="button"
						id={message.id}
						className={cn(
							'flex text-left rounded-md bg-primary px-3 py-1 w-fit max-w-full break-words gap-2',
							!selfOwnsMessage && 'bg-secondary',
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
						<p className={cn('text-[10px] inline-flex items-center gap-1 phone:text-[8px] shrink-0 w-fit text-white/20 text-right self-end')}>
							{formatTime(new Date(message.timestamp), {
								noDate: true,
							})}
							{selfOwnsMessage && (
								<span className={cn(
									optimisticMessage.state === 'read' ? 'text-cyan-700' : 'text-white/50',
								)}
								>
									{optimisticMessage.state === 'read'
										? (
												<CheckCheckIcon className="size-[12px]" strokeWidth="2.125px" />
											)
										: (
												<CheckIcon className="size-[12px]" strokeWidth="2.125px" />
											)}
								</span>
							)}
						</p>
					</button>
					<AnimatePresence>
						{optimisticMessage.reaction && (
							<motion.div
								initial={{ opacity: 0, scale: 0.5 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.5 }}
								transition={{ duration: 0.2 }}
								className={cn(
									'absolute -top-3',
									selfOwnsMessage ? '-left-5' : '-right-5',
								)}
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
				{selfOwnsMessage
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
