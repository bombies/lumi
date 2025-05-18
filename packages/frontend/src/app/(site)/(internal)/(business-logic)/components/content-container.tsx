'use client';

import type { FC, PropsWithChildren } from 'react';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

import { cn } from '@/lib/utils';

const ContentContainer: FC<PropsWithChildren> = ({ children }) => {
	const pathname = usePathname();
	const isMomentView = useMemo(
		() =>
			!!pathname
			&& /^\/moments\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(pathname),
		[pathname],
	);
	return (
		<main
			className={cn(
				'pb-[112px] laptop:pb-[100px] px-6 space-y-12 mt-32 laptop:mt-18',
				isMomentView && 'm-0 laptop:m-0 p-0 laptop:p-0',
			)}
		>
			{children}
		</main>
	);
};

export default ContentContainer;
