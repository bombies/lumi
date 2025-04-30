'use client';

import type { MomentMessage } from '@lumi/core/moments/moment.types';
import type { FC } from 'react';
import { useRelationship } from '@/components/providers/relationships/relationship-provder';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { EmojiPicker, EmojiPickerContent, EmojiPickerSearch } from '@/components/ui/emoji-picker';

import { cn } from '@/lib/utils';
import { FaceSmileIcon, TrashIcon } from '@heroicons/react/24/solid';
import { formatTime } from '@lumi/core/utils/global-utils';
import { useMemo } from 'react';

type Props = {
	message: MomentMessage;
};

const MomentMessageElement: FC<Props> = ({ message }) => {
	const { self, partner } = useRelationship();
	const messageUser = useMemo(() => (message.senderId === self.id ? self : partner), [message, partner, self]);
	const userIsSelf = useMemo(() => messageUser.id === self.id, [messageUser, self]);
	return (
		<ContextMenu>
			<ContextMenuTrigger disabled={!userIsSelf} asChild>
				<button
					type="button"
					id={message.id}
					className={cn(
						'flex text-left rounded-md bg-primary px-3 py-1 w-fit max-w-full self-end break-words gap-2',
						!userIsSelf && 'self-start bg-secondary',
					)}
				>
					<p className="text-white whitespace-pre-wrap">{message.content}</p>
					<p className={cn('text-[10px] phone:text-[8px] shrink-0 w-fit text-white/20 text-right self-end')}>
						{formatTime(new Date(message.timestamp), {
							noDate: true,
						})}
					</p>
				</button>
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<FaceSmileIcon className="size-[18px] text-current mr-2" />
						{' '}
						React
					</ContextMenuSubTrigger>
					<ContextMenuSubContent asChild className="w-56 h-56">
						<EmojiPicker>
							<EmojiPickerSearch />
							<EmojiPickerContent />
						</EmojiPicker>
					</ContextMenuSubContent>
				</ContextMenuSub>
				<ContextMenuItem variant="destructive">
					<TrashIcon className="size-[18px]" />
					{' '}
					Delete
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
};

export default MomentMessageElement;
