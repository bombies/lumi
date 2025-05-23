'use client';

import type { Moment } from '@lumi/core/moments/moment.types';
import type { User as LumiUser } from '@lumi/core/users/user.types';
import type { FC } from 'react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { WebsocketTopic } from '@/components/providers/web-sockets/topics';
import { useWebSocket } from '@/components/providers/web-sockets/web-socket-provider';
import { Separator } from '@/components/ui/separator';
import UserAvatar from '@/components/ui/user-avatar';
import { GetMomentTags } from '@/hooks/trpc/moment-hooks';
import { cn } from '@/lib/utils';
import CommentDrawer from './comment-drawer';
import MomentSettings from './moment-settings';

type Props = {
	moment: Moment;
	uploader?: LumiUser;
	currentUser: LumiUser;
};

const MomentDetailsContainer: FC<Props> = ({ moment, uploader, currentUser: user }) => {
	const { subscribeToTopic } = useWebSocket();
	const { data: momentTags } = GetMomentTags(moment.id);
	const [expanded, setExpanded] = useState(false);

	useEffect(() => {
		subscribeToTopic(WebsocketTopic.momentChatTopic(moment.relationshipId, moment.id));
	}, [moment.id, moment.relationshipId, subscribeToTopic]);

	return (
		<div className="absolute bottom-5 w-full flex justify-center">
			<motion.div
				layout="position"
				className={cn(
					'w-[80%] rounded-sm bg-background/80 text-foreground backdrop-blur-md p-4 flex justify-between items-center gap-2',
					expanded && 'items-end',
				)}
			>
				<div className={cn('flex gap-2 items-center', expanded && 'items-end')}>
					<UserAvatar
						user={uploader}
						className="size-8 border-2 border-foreground"
						containerClassName="shrink-0"
						hideStatus
					/>
					<button type="button" className="text-left cursor-pointer" onClick={() => setExpanded(prev => !prev)}>
						<h6 className={cn('line-clamp-2 text-sm font-bold', expanded && 'line-clamp-none max-h-[80%]')}>
							{moment.title}
						</h6>
						<p
							className={cn(
								'text-xs line-clamp-2 whitespace-pre-wrap',
								expanded && 'line-clamp-none max-h-[80%] overflow-y-scroll',
							)}
						>
							{moment.description}
						</p>
						{momentTags?.length
							? (
									<>
										<Separator className="my-1" />
										<p
											className={cn(
												'text-xs line-clamp-1 whitespace-pre-wrap text-primary',
												expanded && 'line-clamp-none',
											)}
										>
											{momentTags.map(tag => `#${tag.tag}`).join(', ')}
										</p>
									</>
								)
							: undefined}
					</button>
				</div>
				<div className="flex flex-col tablet:flex-row gap-1">
					<CommentDrawer moment={moment} />
					{user.id === uploader?.id && <MomentSettings moment={moment} />}
				</div>
			</motion.div>
		</div>
	);
};

export default MomentDetailsContainer;
