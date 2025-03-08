import { auth } from '@/auth';
import Providers from '@/components/providers/providers';
import { HydrateClient } from '@/lib/trpc/server';
import type { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import { Geist, Geist_Mono } from 'next/font/google';

import './globals.css';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'Lumi',
	description: 'A space for you an your partner.',
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await auth();
	return (
		<html lang="en">
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<SessionProvider session={session}>
					<Providers session={session}>
						<HydrateClient>{children}</HydrateClient>
					</Providers>
				</SessionProvider>
			</body>
		</html>
	);
}
