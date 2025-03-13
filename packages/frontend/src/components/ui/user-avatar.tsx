import { FC } from 'react';
import { User } from '@lumi/core/types/user.types';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from './avatar';
import { Badge } from './badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

type Props = {
	user?: User;
	className?: string;
};

const UserAvatar: FC<Props> = ({ user, className }) => {
	return (
		<Avatar className={cn('relative overflow-visible size-32', className)}>
			<AvatarFallback>{user?.firstName.charAt(0) || '?'}</AvatarFallback>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Badge
							className="absolute bottom-[10%] right-0 rounded-full size-4 p-2 uppercase border-2 border-white"
							variant={
								user?.status === 'online' ? 'primary' : user?.status === 'idle' ? 'warning' : 'default'
							}
						></Badge>
					</TooltipTrigger>
					<TooltipContent>
						{user?.status === 'online' ? 'Online' : user?.status === 'idle' ? 'Idle' : 'Offline'}
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</Avatar>
	);
};

export default UserAvatar;
