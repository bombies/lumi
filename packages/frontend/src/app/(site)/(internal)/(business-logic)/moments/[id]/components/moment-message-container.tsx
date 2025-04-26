'use client';

import { FC, useMemo } from 'react';
import { MomentMessage } from '@lumi/core/moments/moment.types';

import { useRelationship } from '@/components/providers/relationships/relationship-provder';
import UserAvatar from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';
import MomentMessageElement from './moment-message';

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
					<MomentMessageElement key={message.id} message={message} />
				))}
			</div>

			<UserAvatar user={messageUser} className="size-8 border-2" hideStatus />
		</div>
	);
};

export default MomentMessageContainer;
