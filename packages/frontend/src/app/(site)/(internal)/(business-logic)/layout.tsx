import { FC, PropsWithChildren } from 'react';
import { headers } from 'next/headers';

import Footer from '@/components/footer/footer';
import Header from '@/components/header';
import { cn } from '@/lib/utils';

const BusinessLogicLayout: FC<PropsWithChildren> = async ({ children }) => {
	const h = await headers();
	const pathname = h.get('x-current-path');
	const isMomentView =
		!!pathname &&
		new RegExp(/^\/moments\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/g).test(pathname);
	return (
		<>
			<Header />
			<main className={cn('pb-[100px] px-6 space-y-12 mt-18', isMomentView && 'm-0 p-0')}>{children}</main>
			<Footer docked={isMomentView} />
		</>
	);
};

export default BusinessLogicLayout;
