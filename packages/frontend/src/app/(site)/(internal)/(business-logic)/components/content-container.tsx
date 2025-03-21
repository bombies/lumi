'use client';

import { FC, PropsWithChildren, useMemo } from 'react';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const ContentContainer: FC<PropsWithChildren> = ({ children }) => {
	const pathname = usePathname();
	const isMomentView = useMemo(
		() =>
			!!pathname &&
			new RegExp(/^\/moments\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/g).test(pathname),
		[pathname],
	);
	return <main className={cn('pb-[100px] px-6 space-y-12 mt-18', isMomentView && 'm-0 p-0')}>{children}</main>;
};

export default ContentContainer;
