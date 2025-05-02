import type { User } from '@lumi/core/users/user.types';
import type { AvatarProps } from '@radix-ui/react-avatar';
import type { FC } from 'react';

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
	containerClassName?: string;
	statusClassName?: string;
} & AvatarProps;

const UserAvatar: FC<Props> = ({
	user,
	srcOverride,
	loading,
	className,
	containerClassName,
	statusClassName,
	hideStatus,
	...args
}) => {
	return loading
		? (
				<Skeleton className={cn('size-32 rounded-full', className)} />
			)
		: (
				<div className={cn('relative overflow-hidden w-fit h-fit', containerClassName)}>
					<Avatar className={cn('size-32', className)} {...args}>
						<AvatarImage src={srcOverride || user?.avatarUrl} alt={`@${user?.username}`} className="object-cover" />
						<AvatarFallback>{user?.firstName.charAt(0) || '?'}</AvatarFallback>
					</Avatar>
					{!hideStatus && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Badge
										className={cn(
											'absolute bottom-[10%] right-0 rounded-full size-4 p-2 uppercase border-2 border-white',
											statusClassName,
										)}
										variant={
											user?.status === 'online'
												? 'primary'
												: user?.status === 'idle'
													? 'warning'
													: 'default'
										}
									>
									</Badge>
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
