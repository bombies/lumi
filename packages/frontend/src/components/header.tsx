import { FC } from 'react';
import Link from 'next/link';

import NotificationButton from '@/components/notification-button';
import { cn } from '@/lib/utils';

type Props = {
	className?: string;
};

const Header: FC<Props> = ({ className }) => {
	return (
		<header className={cn('flex justify-between w-full px-6 py-3', className)}>
			<Link href="/home">
				<h1 className="font-cursive text-2xl">Lumi.</h1>
			</Link>
			<NotificationButton />
		</header>
	);
};

export default Header;
