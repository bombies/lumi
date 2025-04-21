'use client';

import { FC, useMemo } from 'react';
import { MomentMessage } from '@lumi/core/moments/moment.types';
import { formatTime } from '@lumi/core/utils/global-utils';

import { useRelationship } from '@/components/providers/relationships/relationship-provder';
import UserAvatar from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';

type Props = {
	messages: MomentMessage[];
};

const MomentMessageContainer: FC<Props> = ({ messages }) => {
	const { self, partner } = useRelationship();
	const messageUser = useMemo(() => (messages[0].senderId === self.id ? self : partner), [messages, partner, self]);
	const userIsSelf = useMemo(() => messageUser.id === self.id, [messageUser, self]);
	return (
		<div className={cn('w-full flex justify-end gap-1 self-end', !userIsSelf && 'flex-row-reverse')}>
			<div className="space-y-1 flex max-w-3/4 flex-col">
				{messages.map(message => (
					<div
						key={message.id}
						id={message.id}
						className={cn(
							'flex rounded-md bg-primary px-3 py-1 w-fit max-w-full self-end break-words gap-2',
							!userIsSelf && 'self-start bg-secondary',
						)}
					>
						<p className="text-white whitespace-pre-wrap">{message.content}</p>
						<p
							className={cn(
								'text-[10px] phone:text-[8px] shrink-0 w-fit text-white/20 text-right self-end',
							)}
						>
							{formatTime(new Date(message.timestamp))}
						</p>
					</div>
				))}
			</div>

			<UserAvatar user={messageUser} className="size-8 border-2" hideStatus />
		</div>
	);
};

export default MomentMessageContainer;
