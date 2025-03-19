import { FC } from 'react';
import { User } from '@lumi/core/types/user.types';
import { AvatarProps } from '@radix-ui/react-avatar';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Badge } from './badge';
import { Skeleton } from './skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

type Props = {
	user?: User;
	srcOverride?: string;
	loading?: boolean;
	hideStatus?: boolean;
} & AvatarProps;

const UserAvatar: FC<Props> = ({ user, srcOverride, loading, className, hideStatus, ...args }) => {
	return loading ? (
		<Skeleton className={cn('size-32 rounded-full', className)} />
	) : (
		<div className="relative overflow-hidden">
			<Avatar className={cn(' size-32', className)} {...args}>
				<AvatarImage src={srcOverride || user?.avatarUrl} alt={'@' + user?.username} className="object-cover" />
				<AvatarFallback>{user?.firstName.charAt(0) || '?'}</AvatarFallback>
			</Avatar>
			{!hideStatus && (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Badge
								className="absolute bottom-[10%] right-0 rounded-full size-4 p-2 uppercase border-2 border-white"
								variant={
									user?.status === 'online'
										? 'primary'
										: user?.status === 'idle'
											? 'warning'
											: 'default'
								}
							></Badge>
						</TooltipTrigger>
						<TooltipContent>
							{user?.status === 'online' ? 'Online' : user?.status === 'idle' ? 'Idle' : 'Offline'}
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)}
		</div>
	);
};

export default UserAvatar;
