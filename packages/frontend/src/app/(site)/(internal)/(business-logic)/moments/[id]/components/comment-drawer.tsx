'use client';

import type { Moment, MomentMessage } from '@lumi/core/moments/moment.types';
import type { WebSocketEventHandler } from '@lumi/core/websockets/websockets.types';
import type { Variants } from 'motion/react';
import type { FC } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { ChatBubbleOvalLeftEllipsisIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';

import MomentMessageGroup from '@/app/(site)/(internal)/(business-logic)/moments/[id]/components/moment-message-group';
import MomentMessageGroupProvider from '@/app/(site)/(internal)/(business-logic)/moments/[id]/components/moment-message-group-provider';
import MomentMessageGroupSkeleton from '@/app/(site)/(internal)/(business-logic)/moments/[id]/components/moment-message-group-skeleton';
import { useRelationship } from '@/components/providers/relationships/relationship-provder';
import { WebsocketTopic } from '@/components/providers/web-sockets/topics';
import { useWebSocket } from '@/components/providers/web-sockets/web-socket-provider';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import EasyForm from '@/components/ui/form-extras/easy-form';
import EasyFormField from '@/components/ui/form-extras/easy-form-field';
import InfiniteLoader from '@/components/ui/infinite-loader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import UserAvatar from '@/components/ui/user-avatar';
import { GetMessagesForMoment } from '@/hooks/trpc/moment-hooks';
import { logger } from '@/lib/logger';

type Props = {
	moment: Moment;
};

const formSchema = z.object({
	messageContent: z.string(),
});

type FormSchema = z.infer<typeof formSchema>;

const dotVariants: Variants = {
	jump: {
		y: -2.5,
		transition: {
			duration: 0.25,
			repeat: Infinity,
			repeatType: 'mirror',
			ease: 'easeInOut',
		},
	},
};

const CommentDrawer: FC<Props> = ({ moment }) => {
	const {
		data: messagePages,
		isLoading: messagesLoading,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage,
	} = GetMessagesForMoment(moment.id);
	const { self, partner, sendNotificationToPartner, selfState } = useRelationship();
	const { addEventHandler, removeEventHandler, emitEvent } = useWebSocket();
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [newMessages, setNewMessages] = useState<MomentMessage[]>([]);
	const [partnerTyping, setPartnerTyping] = useState(false);
	const [selfTyping, setSelfTyping] = useState(false);
	const submitButtonRef = useRef<HTMLButtonElement>(null);

	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const scrollToBottom = useCallback((onSuccess?: () => void) => {
		const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
		if (viewport) {
			logger.debug('Viewport found, scrolling to bottom!');
			viewport.scrollTop = viewport.scrollHeight;
			onSuccess?.();
		}
	}, []);

	useEffect(() => {
		if (!drawerOpen) return;

		const observer = new MutationObserver(() => {
			scrollToBottom(() => {
				observer.disconnect(); // Stop observing once done
				logger.debug('Scroll area viewport was found and scroll was completed!');
			});
		});

		logger.debug('Observing for scroll area changes...');
		observer.observe(document.body, { childList: true, subtree: true });

		return () => observer.disconnect();
	}, [drawerOpen, scrollToBottom]);

	const fetchedMessages = useMemo(() => {
		if (!messagePages) return [];
		return messagePages.pages.flatMap(page => page.data).reverse();
	}, [messagePages]);

	const fetchedMessageIds = useMemo(() => {
		return new Set(fetchedMessages.map(msg => msg.id));
	}, [fetchedMessages]);

	const allMessages = useMemo(() => {
		const uniqueNewMessages = newMessages.filter(newMsg => !fetchedMessageIds.has(newMsg.id));
		return [...fetchedMessages, ...uniqueNewMessages];
	}, [fetchedMessages, newMessages, fetchedMessageIds]);

	const groupedMessages = useMemo(() => {
		const messagesByDay = Object.groupBy(allMessages, (message) => {
			const date = new Date(message.timestamp);
			const epoch = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
			return epoch.toString();
		});

		const finalGroups: Record<string, [string, MomentMessage[]][]> = {};
		for (const [date, messages] of Object.entries(messagesByDay)) {
			if (!messages) return;
			const groupedMessages: [string, MomentMessage[]][] = [];

			for (const message of messages) {
				// Iterate over combined list
				const latestGroup = groupedMessages[groupedMessages.length - 1];

				if (!latestGroup || latestGroup[0] !== message.senderId) {
					groupedMessages.push([message.senderId, [message]]);
				} else {
					latestGroup[1].push(message);
				}
			}

			finalGroups[date] = groupedMessages;
		}

		return finalGroups;
	}, [allMessages]);

	const messageElements = useMemo(() => {
		if (!groupedMessages) return undefined;
		// Use stable message ID for keys if possible within MomentMessageContainer
		// The group key remains less stable but necessary for grouping render
		return Object.entries(groupedMessages).map(([date, messageGroup]) => (
			<MomentMessageGroupProvider key={`datecontainer_${date}`} scrollAreaRef={scrollAreaRef}>
				<MomentMessageGroup date={date} messageContainers={messageGroup} />
			</MomentMessageGroupProvider>
		));
	}, [groupedMessages]);

	useEffect(() => {
		scrollToBottom();
	}, [messageElements, scrollToBottom, partnerTyping]);

	const addNewMessage = useCallback((message: MomentMessage) => {
		setNewMessages((prev) => {
			if (prev.some(m => m.id === message.id)) {
				return prev;
			}
			return [...prev, message];
		});
	}, []);

	// Handle receiving messages in real-time.
	useEffect(() => {
		const handleMessageReceive: WebSocketEventHandler<'momentChat'> = (payload) => {
			// Ignore messages sent by self (already handled optimistically)
			if (payload.senderId === self.id) return;

			const message = {
				id: payload.messageId ?? crypto.randomUUID(),
				senderId: payload.senderId,
				momentId: moment.id,
				content: payload.message,
				timestamp: payload.timestamp,
			} satisfies MomentMessage;

			addNewMessage(message);
			setPartnerTyping(false);
		};

		const handleTypingStart: WebSocketEventHandler<'momentTypingStart'> = (payload) => {
			if (payload.senderId === self.id) return;
			setPartnerTyping(true);
		};

		const handleTypingEnd: WebSocketEventHandler<'momentTypingEnd'> = (payload) => {
			if (payload.senderId === self.id) return;
			setPartnerTyping(false);
		};

		addEventHandler('momentChat', handleMessageReceive);
		addEventHandler('momentTypingStart', handleTypingStart);
		addEventHandler('momentTypingEnd', handleTypingEnd);

		return () => {
			removeEventHandler('momentChat', handleMessageReceive);
			removeEventHandler('momentTypingStart', handleTypingStart);
			removeEventHandler('momentTypingEnd', handleTypingEnd);
		};
	}, [addEventHandler, removeEventHandler, self.id, moment.id, addNewMessage]);

	const sendMessage = useCallback<SubmitHandler<FormSchema>>(
		async ({ messageContent }) => {
			const optimisticMessage = {
				id: crypto.randomUUID(),
				senderId: self.id,
				momentId: moment.id,
				content: messageContent,
				timestamp: new Date().toISOString(),
			} satisfies MomentMessage;

			addNewMessage(optimisticMessage);
			scrollToBottom();

			await emitEvent(
				'momentTypingEnd',
				{
					senderId: self.id,
					timestamp: new Date().toISOString(),
				},
				{
					topic: WebsocketTopic.momentChatTopic(moment.relationshipId, moment.id),
				},
			);
			setSelfTyping(false);

			await emitEvent(
				'momentChat',
				{
					senderId: self.id,
					message: messageContent,
					messageId: optimisticMessage.id,
					timestamp: optimisticMessage.timestamp,
					momentId: moment.id,
				},
				{
					topic: WebsocketTopic.momentChatTopic(moment.relationshipId, moment.id),
				},
			);

			await sendNotificationToPartner({
				title: `📩 New Moment Message`,
				content: `${self.firstName}:  ${messageContent}`,
				openUrl: `/moments/${moment.id}`,
				metadata: {
					momentId: moment.id,
				},
			});
		},
		[
			addNewMessage,
			emitEvent,
			moment.id,
			moment.relationshipId,
			scrollToBottom,
			self.firstName,
			self.id,
			sendNotificationToPartner,
		],
	);

	return (
		<Drawer
			open={drawerOpen}
			onOpenChange={(val) => {
				setDrawerOpen(val);
				if (val) {
					selfState?.updateState?.('viewingMomentMessages', {
						momentId: moment.id,
					});
				} else {
					selfState?.updateState?.(null);
				}
			}}
		>
			<DrawerTrigger asChild>
				<Button className="bg-transparent text-foreground" size="icon">
					<ChatBubbleOvalLeftEllipsisIcon className="size-[18px]" />
				</Button>
			</DrawerTrigger>
			<DrawerContent className="h-[75vh] px-6 py-2" onWheel={e => e.stopPropagation()}>
				<div className="h-[calc(75vh-24px-16px)] overflow-auto flex flex-col justify-between gap-2 pt-4">
					{/* Messages container */}
					<ScrollArea className="h-full overflow-auto flex flex-col-reverse" ref={scrollAreaRef}>
						{messagesLoading
							? (
									<MomentMessageGroupSkeleton />
								)
							: (
									<>
										{messageElements}
										<AnimatePresence>
											{partnerTyping && (
												<motion.div
													initial={{
														opacity: 0,
														y: 10,
													}}
													animate={{
														opacity: 1,
														y: 0,
													}}
													exit={{
														opacity: 0,
														y: 10,
													}}
													className="flex items-center gap-1"
												>
													<UserAvatar user={partner} hideStatus className="size-8 border-2" />
													<motion.div
														animate="jump"
														transition={{ staggerChildren: -0.2, staggerDirection: -1 }}
														className="bg-secondary rounded-full h-6 w-fit px-3 flex justify-center items-center gap-1"
													>
														<motion.span
															variants={dotVariants}
															className="size-2 rounded-full bg-primary"
														>
														</motion.span>
														<motion.span
															variants={dotVariants}
															className="size-2 rounded-full bg-primary"
														>
														</motion.span>
														<motion.span
															variants={dotVariants}
															className="size-2 rounded-full bg-primary"
														>
														</motion.span>
													</motion.div>
												</motion.div>
											)}
										</AnimatePresence>
									</>
								)}
						<InfiniteLoader hasMore={hasNextPage} fetchMore={fetchNextPage} loading={isFetchingNextPage} />
					</ScrollArea>
					{/* Chat input */}
					<div className="flex gap-2 shrink-0 p-2">
						<EasyForm schema={formSchema} onSubmit={sendMessage} className="w-full" clearOnSubmit>
							<EasyFormField<FormSchema> name="messageContent">
								{(_form, field) => (
									<Textarea
										{...field}
										value={field.value ?? ''}
										className="rounded-2xl w-full"
										inputClassName="resize-none"
										placeholder="Send a message"
										variableHeight={{
											maxHeight: 500,
										}}
										onKeyDown={(e) => {
											if (e.ctrlKey && e.key === 'Enter') submitButtonRef.current?.click();
										}}
										isTyping={selfTyping}
										setIsTyping={setSelfTyping}
										onTypingStart={async () => {
											await emitEvent(
												'momentTypingStart',
												{
													senderId: self.id,
													timestamp: new Date().toISOString(),
												},
												{
													topic: WebsocketTopic.momentChatTopic(
														moment.relationshipId,
														moment.id,
													),
												},
											);
										}}
										typingEndDelay={1000}
										onTypingEnd={async () => {
											await emitEvent(
												'momentTypingEnd',
												{
													senderId: self.id,
													timestamp: new Date().toISOString(),
												},
												{
													topic: WebsocketTopic.momentChatTopic(
														moment.relationshipId,
														moment.id,
													),
												},
											);
										}}
										endContent={
											field.value?.length > 0 && (
												<Button
													ref={submitButtonRef}
													type="submit"
													className="bg-primary text-background rounded-full p-2 size-8 mr-1"
												>
													<PaperAirplaneIcon className="size-[18px]" />
												</Button>
											)
										}
									/>
								)}
							</EasyFormField>
						</EasyForm>
					</div>
				</div>
			</DrawerContent>
		</Drawer>
	);
};

export default CommentDrawer;
