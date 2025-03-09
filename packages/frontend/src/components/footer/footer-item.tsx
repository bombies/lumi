'use client';

import { FC, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconType } from '@icons-pack/react-simple-icons';

import { cn } from '@/lib/utils';

type FooterItemProps = {
	label: string;
	icon: IconType;
	href: string;
};

const FooterItem: FC<FooterItemProps> = ({ label, icon: Icon, href }) => {
	const pathName = usePathname();
	const isActive = useMemo(() => pathName.toLowerCase().startsWith(href.toLowerCase()), [href, pathName]);

	return (
		<Link
			href={href}
			className={cn(
				'w-20 flex flex-col items-center justify-center transition-colors hover:bg-primary/50 text-foreground hover:text-background rounded-2xl p-2 gap-y-[2px]',
				isActive && 'bg-primary text-background',
			)}
		>
			<Icon className="size-[20px] shrink-0" />
			<p className="text-[.6rem] text-center">{label}</p>
		</Link>
	);
};

export default FooterItem;
