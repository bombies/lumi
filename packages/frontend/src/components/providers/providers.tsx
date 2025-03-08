'use client';

import { TRPCProvider } from '@/lib/trpc/client';
import { Session } from 'next-auth';
import { FC, PropsWithChildren } from 'react';
import { Toaster } from 'sonner';

type Props = {
	session: Session | null;
};

const Providers: FC<PropsWithChildren<Props>> = ({ children, session }) => {
	return (
		<TRPCProvider>
			{children}
			<Toaster />
		</TRPCProvider>
	);
};

export default Providers;
