'use client';

import { FC, PropsWithChildren } from 'react';
import { Toaster } from 'sonner';

import ColorSchemeProvider from '@/components/providers/color-scheme-provider';
import { TRPCProvider } from '@/lib/trpc/client';

const Providers: FC<PropsWithChildren> = ({ children }) => {
	return (
		<TRPCProvider>
			<ColorSchemeProvider>
				{children}
				<Toaster />
			</ColorSchemeProvider>
		</TRPCProvider>
	);
};

export default Providers;
