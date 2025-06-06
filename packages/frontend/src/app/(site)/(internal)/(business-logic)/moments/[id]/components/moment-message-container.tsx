'use client';

import type { MomentMessage } from '@lumi/core/moments/moment.types';
import type { FC } from 'react';
import { useMemo } from 'react';

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

			{!userIsSelf && <UserAvatar user={messageUser} className="size-8 border-2" statusClassName="size-2 p-0 border-1" />}
		</div>
	);
};

export default MomentMessageContainer;
