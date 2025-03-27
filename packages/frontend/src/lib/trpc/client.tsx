'use client';

import { useEffect, useMemo } from 'react';
import { AppRouter } from '@lumi/functions/types';
import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';

import { auth } from '../better-auth/auth-client';
import { makeQueryClient } from './query-client';

export const trpc = createTRPCReact<AppRouter>();
let clientQueryClientSingleton: QueryClient;
function getQueryClient() {
	if (typeof window === 'undefined') {
		// Server: always make a new query client
		return makeQueryClient();
	}
	// Browser: use singleton pattern to keep the same query client
	return (clientQueryClientSingleton ??= makeQueryClient());
}
function getUrl() {
	return process.env.NEXT_PUBLIC_TRPC_URL!;
}
export function TRPCProvider(
	props: Readonly<{
		children: React.ReactNode;
	}>,
) {
	// NOTE: Avoid useState when initializing the query client if you don't
	//       have a suspense boundary between this and the code that may
	//       suspend because React will throw away the client on the initial
	//       render if it suspends and there is no boundary

	useEffect(() => {
		(async () => {
			const session = await auth.getSession();
			const response = await fetch('/api/auth/token', {
				headers: {
					Authorization: `Bearer ${session.data?.session.token}`,
				},
			});

			const token = (await response.json()).token;
			if (token) localStorage.setItem('auth-jwt', token);
		})();
	}, []);

	const queryClient = getQueryClient();
	const trpcClient = useMemo(
		() =>
			trpc.createClient({
				links: [
					httpBatchLink({
						// transformer: superjson, <-- if you use a data transformer
						url: getUrl(),
						headers: async () => {
							const accessToken = localStorage.getItem('auth-jwt');

							return {
								authorization: accessToken ? `Bearer ${accessToken}` : '',
							};
						},
					}),
				],
			}),
		[],
	);

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
		</trpc.Provider>
	);
}
