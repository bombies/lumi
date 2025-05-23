import type { FC } from 'react';
import Link from 'next/link';

import NotificationButton from '@/components/notifications/notification-button';
import { cn } from '@/lib/utils';
import UserProfileButton from './user-profile-button';

type Props = {
	className?: string;
};

const Header: FC<Props> = ({ className }) => {
	return (
		<header
			className={cn(
				'fixed top-0 z-20 laptop:static flex justify-between w-full px-6 py-3 border-b border-border bg-background/50 backdrop-blur-lg',
				className,
			)}
		>
			<Link href="/home">
				<h1 className="font-cursive text-2xl">Lumi.</h1>
			</Link>
			<div className="flex gap-2 items-center">
				<NotificationButton />
				<UserProfileButton />
			</div>
		</header>
	);
};

export default Header;
