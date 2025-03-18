import type { Metadata } from 'next';
import { Cookie } from 'next/font/google';
import localFont from 'next/font/local';

import Providers from '@/components/providers/providers';
import { HydrateClient } from '@/lib/trpc/server';

import './globals.css';

import SessionProvider from '@/components/providers/session-provider';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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
	description: 'A space for you an your partner.',
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const supabaseSession = await createSupabaseServerClient();
	const supabaseUser = await supabaseSession.auth.getUser();

	return (
		<html lang="en" className={`${sfProDisplay.variable} ${cookie.variable}`}>
			<body className={`antialiased`}>
				<SessionProvider userResponse={supabaseUser}>
					<Providers>
						<HydrateClient>{children}</HydrateClient>
					</Providers>
				</SessionProvider>
			</body>
		</html>
	);
}
