import type { Metadata, Viewport } from 'next';
import { Cookie } from 'next/font/google';
import localFont from 'next/font/local';

import Providers from '@/components/providers/providers';
import { getHydrationHelpers } from '@/lib/trpc/server';

import './globals.css';

import Script from 'next/script';

import { getServerSession } from '@/lib/better-auth/auth-actions';

const sfProDisplay = localFont({
	src: './fonts/sf-pro-display/SF-Pro.ttf',
	variable: '--font-sf-pro-display',
});

const cookie = Cookie({
	variable: '--font-cookie',
	display: 'swap',
	weight: '400',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'Lumi',
	description: 'A space for you and your partner.',
	appleWebApp: {
		capable: true,
		statusBarStyle: 'black-translucent',
	},
};

export const viewport: Viewport = {
	maximumScale: 1,
	userScalable: false,
	interactiveWidget: 'resizes-content',
	themeColor: [
		{
			media: '(prefers-color-scheme: dark)',
			color: '#10130d',
		},
		{
			media: '(prefers-color-scheme: light)',
			color: '#f8fff1',
		},
	],
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	await getServerSession();
	const { HydrateClient } = await getHydrationHelpers();

	return (
		<html lang="en" className={`${sfProDisplay.variable} ${cookie.variable}`}>
			<body className={`antialiased`}>
				<Providers>
					<HydrateClient>{children}</HydrateClient>
				</Providers>
				<Script
					strategy="beforeInteractive"
					type="text/javascript"
					src="https://cdn.jsdelivr.net/npm/ios-pwa-splash@1.0.0/cdn.min.js"
				/>
				<Script
					id="load-ios-splash"
					dangerouslySetInnerHTML={{
						__html: `iosPWASplash('/web-app-manifest-512x512.png', '#76A34E');`,
					}}
				/>
			</body>
		</html>
	);
}
