'use client';

import { FC, PropsWithChildren } from 'react';
import { ProgressProvider } from '@bprogress/next/app';
import { User } from '@lumi/core/types/user.types';
import { Toaster } from 'sonner';

import InstallPrompt from '@/components/notifications/install-prompt';
import NotificationsProvider from '@/components/notifications/notifications-provider';
import ColorSchemeProvider from '@/components/providers/color-scheme-provider';
import { buttonVariants } from '@/components/ui/button';
import { TRPCProvider } from '@/lib/trpc/client';

type ProvidersProps = PropsWithChildren;

const Providers: FC<ProvidersProps> = ({ children }) => {
	return (
		<TRPCProvider>
			<ColorSchemeProvider>
				<NotificationsProvider>
					<ProgressProvider height="4px" color="#76A34E" options={{ showSpinner: true }} shallowRouting>
						{children}
						<Toaster
							position="top-right"
							toastOptions={{
								unstyled: true,
								classNames: {
									toast: 'rounded-lg border border-b bg-primary/10 backdrop-blur-md antialiased p-4 flex gap-4 items-center',
									title: '',
									description: 'text-foreground',
									actionButton: buttonVariants({ variant: 'default' }),
									cancelButton: buttonVariants({ variant: 'destructive' }),
									closeButton: '',
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
