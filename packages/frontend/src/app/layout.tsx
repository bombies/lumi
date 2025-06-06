import type { Metadata, Viewport } from 'next';
import { Cookie } from 'next/font/google';
import localFont from 'next/font/local';

import Script from 'next/script';
import Providers from '@/components/providers/providers';

import ReactScan from '@/components/react-scan';

import { getServerSession } from '@/lib/better-auth/auth-actions';

import { getHydrationHelpers } from '@/lib/trpc/server';
import './globals.css';

const sfProDisplay = localFont({
	src: [
		{
			path: './fonts/sf-pro-display/SF-Pro-Display-Ultralight.otf',
			weight: '100',
			style: 'normal',
		},
		{
			path: './fonts/sf-pro-display/SF-Pro-Display-UltralightItalic.otf',
			weight: '100',
			style: 'italic',
		},
		{
			path: './fonts/sf-pro-display/SF-Pro-Display-Light.otf',
			weight: '200',
			style: 'normal',
		},
		{
			path: './fonts/sf-pro-display/SF-Pro-Display-LightItalic.otf',
			weight: '200',
			style: 'italic',
		},
		{
			path: './fonts/sf-pro-display/SF-Pro-Display-Thin.otf',
			weight: '300',
			style: 'normal',
		},
		{
			path: './fonts/sf-pro-display/SF-Pro-Display-ThinItalic.otf',
			weight: '300',
			style: 'italic',
		},
		{
			path: './fonts/sf-pro-display/SF-Pro-Display-Regular.otf',
			weight: '400',
			style: 'normal',
		},
		{
			path: './fonts/sf-pro-display/SF-Pro-Display-RegularItalic.otf',
			weight: '400',
			style: 'italic',
		},
		{
			path: './fonts/sf-pro-display/SF-Pro-Display-Medium.otf',
			weight: '500',
			style: 'normal',
		},
		{
			path: './fonts/sf-pro-display/SF-Pro-Display-MediumItalic.otf',
			weight: '500',
			style: 'italic',
		},
		{
			path: './fonts/sf-pro-display/SF-Pro-Display-Semibold.otf',
			weight: '600',
			style: 'normal',
		},
		{
			path: './fonts/sf-pro-display/SF-Pro-Display-SemiboldItalic.otf',
			weight: '600',
			style: 'italic',
		},
		{
			path: './fonts/sf-pro-display/SF-Pro-Display-Bold.otf',
			weight: '700',
			style: 'normal',
		},
		{
			path: './fonts/sf-pro-display/SF-Pro-Display-BoldItalic.otf',
			weight: '700',
			style: 'italic',
		},
		{
			path: './fonts/sf-pro-display/SF-Pro-Display-Heavy.otf',
			weight: '800',
			style: 'normal',
		},
		{
			path: './fonts/sf-pro-display/SF-Pro-Display-HeavyItalic.otf',
			weight: '800',
			style: 'italic',
		},
		{
			path: './fonts/sf-pro-display/SF-Pro-Display-Black.otf',
			weight: '900',
			style: 'normal',
		},
		{
			path: './fonts/sf-pro-display/SF-Pro-Display-BlackItalic.otf',
			weight: '900',
			style: 'italic',
		},
	],

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
		statusBarStyle: 'default',
		title: 'Lumi',
	},
	other: {
		'apple-mobile-web-app-capable': 'yes',
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
		<html lang="en" className={`${sfProDisplay.variable} ${cookie.variable} antialiased`}>
			{process.env.NODE_ENV === 'development' && <ReactScan />}
			<body className="antialiased">
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
					strategy="beforeInteractive"
					type="text/javascript"
					dangerouslySetInnerHTML={{
						__html: `
						try { iosPWASplash('/web-app-manifest-512x512.png', '#76A34E');} catch (e) { console.error('Something went wrong setting the splash screen!', e);}`,
					}}
				/>
			</body>
		</html>
	);
}
