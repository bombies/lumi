'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChatBubbleOvalLeftEllipsisIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { Moment, MomentMessage } from '@lumi/core/moments/moment.types';
import { WebSocketEventHandler } from '@lumi/core/websockets/websockets.types';
import { AnimatePresence, motion, Variants } from 'motion/react';
import { SubmitHandler } from 'react-hook-form';
import { z } from 'zod';

import { useRelationship } from '@/components/providers/relationships/relationship-provder';
import { WebsocketTopic } from '@/components/providers/web-sockets/topics';
import { useWebSocket } from '@/components/providers/web-sockets/web-socket-provider';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import EasyForm from '@/components/ui/form-extras/easy-form';
import EasyFormField from '@/components/ui/form-extras/easy-form-field';
import InfiniteLoader from '@/components/ui/infinite-loader';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import UserAvatar from '@/components/ui/user-avatar';
import { GetMessagesForMoment } from '@/hooks/trpc/moment-hooks';
import MomentMessageContainer from './moment-message-container';

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
	const [messages, setMessages] = useState<MomentMessage[]>([]);
	const [partnerTyping, setPartnerTyping] = useState(false);
	const submitButtonRef = useRef<HTMLButtonElement>(null);

	const addMessage = useCallback((message: MomentMessage) => {
		setMessages(prev => [...prev, message]);
	}, []);

	const addMessasgeHistory = useCallback((messages: MomentMessage[]) => {
		setMessages(prev => [...messages, ...prev]);
	}, []);

	useEffect(() => {
		if (!messagePages) return;
		const mostRecentPage = messagePages.pages[messagePages.pages.length - 1];
		addMessasgeHistory(mostRecentPage.data.toReversed());
	}, [addMessasgeHistory, messagePages]);

	const messageElements = useMemo(() => {
		const groupedMessages: [string, MomentMessage[]][] = [];

		for (let idx = 0; idx < messages.length; idx++) {
			const latestGroup: [string, MomentMessage[]] | undefined = groupedMessages[groupedMessages.length - 1];

			if (!latestGroup) {
				groupedMessages.push([messages[idx].senderId, [messages[idx]]]);
				continue;
			}

			if (latestGroup[0] === messages[idx].senderId) {
				latestGroup[1].push(messages[idx]);
			} else {
				groupedMessages.push([messages[idx].senderId, [messages[idx]]]);
			}
		}

		return groupedMessages.map(([senderId, messages], idx) => (
			<MomentMessageContainer key={`messagecontainer_${senderId}_${idx}`} messages={messages} />
		));
	}, [messages]);

	// Handle receiving messages in real-time.
	useEffect(() => {
		const handleMessageReceive: WebSocketEventHandler<'momentChat'> = payload => {
			if (payload.senderId === self.id) return;
			const message = {
				id: crypto.randomUUID(),
				senderId: payload.senderId,
				momentId: moment.id,
				content: payload.message,
				timestamp: payload.timestamp,
			} satisfies MomentMessage;
			addMessage(message);
		};

		const handleTypingStart: WebSocketEventHandler<'momentTypingStart'> = payload => {
			if (payload.senderId === self.id) return;
			setPartnerTyping(true);
		};

		const handleTypingEnd: WebSocketEventHandler<'momentTypingEnd'> = payload => {
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
	}, [addEventHandler, addMessage, moment.id, removeEventHandler, self.id]);

	const sendMessage = useCallback<SubmitHandler<FormSchema>>(
		async ({ messageContent }) => {
			const optimisticMessage = {
				id: crypto.randomUUID(),
				senderId: self.id,
				momentId: moment.id,
				content: messageContent,
				timestamp: new Date().toISOString(),
			} satisfies MomentMessage;

			addMessage(optimisticMessage);

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

			await emitEvent(
				'momentChat',
				{
					senderId: self.id,
					message: messageContent,
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
		[addMessage, emitEvent, moment.id, moment.relationshipId, self.firstName, self.id, sendNotificationToPartner],
	);

	return (
		<Drawer
			open={drawerOpen}
			onOpenChange={val => {
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
					<div className="overflow-auto flex flex-col-reverse" autoFocus>
						{messagesLoading ? (
							<Spinner />
						) : (
							<>
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
												></motion.span>
												<motion.span
													variants={dotVariants}
													className="size-2 rounded-full bg-primary"
												></motion.span>
												<motion.span
													variants={dotVariants}
													className="size-2 rounded-full bg-primary"
												></motion.span>
											</motion.div>
										</motion.div>
									)}
								</AnimatePresence>
								<div className="space-y-1 flex flex-col">{messageElements}</div>
							</>
						)}
						<InfiniteLoader hasMore={hasNextPage} fetchMore={fetchNextPage} loading={isFetchingNextPage} />
					</div>
					{/* Chat input */}
					<div className="flex gap-2 shrink-0 p-2">
						<EasyForm schema={formSchema} onSubmit={sendMessage} className="w-full" clearOnSubmit>
							<EasyFormField<FormSchema> name="messageContent">
								{(form, field) => (
									<Textarea
										className="rounded-2xl w-full h-fit"
										inputClassName="resize-none h-fit"
										placeholder="Send a message"
										variableHeight={{
											maxHeight: 500,
										}}
										onKeyDown={e => {
											if (e.ctrlKey && e.key === 'Enter') submitButtonRef.current?.click();
										}}
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
