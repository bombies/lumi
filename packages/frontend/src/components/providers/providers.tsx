'use client';

import { FC, PropsWithChildren } from 'react';
import { ProgressProvider } from '@bprogress/next/app';
import { Toaster } from 'sonner';

import InstallPrompt from '@/components/notifications/install-prompt';
import NotificationsProvider from '@/components/notifications/notifications-provider';
import ColorSchemeProvider from '@/components/providers/color-scheme-provider';
import { PullRefresh } from '@/components/pull-refresh';
import { TRPCProvider } from '@/lib/trpc/client';
import { buttonVariants } from '../ui/button';

type ProvidersProps = PropsWithChildren;

const Providers: FC<ProvidersProps> = ({ children }) => {
	return (
		<TRPCProvider>
			<ColorSchemeProvider>
				<NotificationsProvider>
					<ProgressProvider height="4px" color="#76A34E" options={{ showSpinner: false }} shallowRouting>
						<PullRefresh />
						{children}
						<Toaster
							position="top-right"
							toastOptions={{
								unstyled: true,
								classNames: {
									toast: 'rounded-lg border border-b bg-primary/10 backdrop-blur-md antialiased p-4 flex gap-2 items-center',
									title: 'font-bold',
									description: 'text-foreground',
									actionButton: buttonVariants({ variant: 'default' }),
									cancelButton: buttonVariants({ variant: 'destructive' }),
									closeButton: '',
									icon: 'size-[18px] text-accent relative flex self-start',
								},
							}}
						/>
						<InstallPrompt />
					</ProgressProvider>
				</NotificationsProvider>
			</ColorSchemeProvider>
		</TRPCProvider>
	);
};

export default Providers;
