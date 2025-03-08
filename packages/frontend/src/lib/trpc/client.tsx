'use client';

import { AppRouter } from '@lumi/functions/types';
import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

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
	const { data: session } = useSession();
	const queryClient = getQueryClient();
	const trpcClient = useMemo(
		() =>
			trpc.createClient({
				links: [
					httpBatchLink({
						// transformer: superjson, <-- if you use a data transformer
						url: getUrl(),
						headers: () => {
							const token = session?.backendToken;
							return {
								authorization: token ? `Bearer ${token}` : '',
							};
						},
					}),
				],
			}),
		[session?.backendToken],
	);

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>
				{props.children}
			</QueryClientProvider>
		</trpc.Provider>
	);
}
