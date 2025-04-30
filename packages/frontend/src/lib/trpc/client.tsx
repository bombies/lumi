'use client';

import type { AppRouter } from '@lumi/functions/types';
import type { QueryClient } from '@tanstack/react-query';
import type { TRPCClientError } from '@trpc/client';
import { trpc } from '@/lib/trpc/trpc-react';
import { QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';

import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { auth } from '../better-auth/auth-client';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { logger } from '../logger';
import { makeQueryClient } from './query-client';

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
	const localStorage = useLocalStorage();
	const storageRef = useRef(localStorage);
	const [accessToken, setAccessToken] = useState<string>();
	// NOTE: Avoid useState when initializing the query client if you don't
	//       have a suspense boundary between this and the code that may
	//       suspend because React will throw away the client on the initial
	//       render if it suspends and there is no boundary

	useEffect(() => {
		storageRef.current = localStorage;
	}, [localStorage]);

	useEffect(() => {
		if (!localStorage) return;

		// Set the auth-jwt key to the current access token if available
		if (accessToken) {
			localStorage.setItemRaw('auth-jwt', accessToken);
		}

		const listener = async (e: StorageEvent) => {
			if (e.key === 'auth-jwt' && e.newValue) {
				logger.debug('Auth token changed! Setting a new access token...');
				setAccessToken(e.newValue);
			}
		};

		window.addEventListener('storage', listener);
		return () => window.removeEventListener('storage', listener);
	}, [accessToken, localStorage, setAccessToken]);

	const fetchAccessToken = useCallback(async () => {
		logger.debug('Setting a new access token...');
		const session = await auth.getSession();

		if (session.error || !session.data) {
			logger.debug('User is not authenticated! Could not set an access token.');
			return;
		}

		logger.debug('Attempting to get auth token using session data:', session.data.session);

		const response = await axios.get<{ token: string }>('/api/auth/token', {
			headers: {
				Authorization: `Bearer ${session.data!.session.token}`,
			},
		});

		logger.debug('Fetched a new auth token!', response.data.token);
		setAccessToken(response.data.token);
		return response.data.token;
	}, []);

	useEffect(() => {
		if (!localStorage) return;

		(async () => {
			const existingToken = localStorage.getItemRaw('auth-jwt');
			if (existingToken) return;
			await fetchAccessToken();
		})();
	}, [localStorage, fetchAccessToken]);

	const queryClient = getQueryClient();
	const trpcClient = useMemo(
		() =>
			// @ts-expect-error Trpc being weird with types
			trpc.createClient<AppRouter>({
				links: [
					httpBatchLink({
						// transformer: superjson, <-- if you use a data transformer
						url: getUrl(),
						headers: async () => {
							const storedToken = accessToken ?? storageRef.current?.getItemRaw('auth-jwt');

							return {
								authorization: storedToken ? `Bearer ${storedToken}` : '',
							};
						},
						fetch: async (url, options) => {
							const response = await fetch(url, options);
							if (response.status === 401) {
								const error = (await response.json()) as { error: TRPCClientError<AppRouter> }[];
								const errMsg = error[0].error.message;
								logger.debug('TRPC fetch error', errMsg);
								if (errMsg.includes('expired')) {
									const newToken = await fetchAccessToken();

									if (!newToken) logger.error('Was not able to fetch a new access token!');

									return await fetch(url, {
										...options,
										headers: {
											...options?.headers,
											Authorization: `Bearer ${newToken}`,
										},
									});
								} else if (errMsg.includes('not authenticated')) {
									// Try again
									logger.debug(
										'Request failed authentication, hoping the client has been hydrated and trying again.',
									);

									logger.debug(`Retrying request with token: ${accessToken}`);

									let token: string | null = null;
									if (!accessToken) {
										logger.debug(
											'The access token doesn\'t exist... Attempting to create a new one',
										);
										token = (await fetchAccessToken()) ?? null;

										if (!accessToken) {
											logger.debug('Could not create a new access token!');
										} else {
											setAccessToken(token ?? undefined);
											logger.debug(
												`New access token created: ${accessToken}. Using it in the retried request.`,
											);
										}
									}

									return await fetch(url, {
										...options,
										headers: {
											...options?.headers,
											Authorization: accessToken ? `Bearer ${accessToken ?? token}` : '',
										},
									});
								}
							}
							return response;
						},
					}),
				],
			}),
		[accessToken, fetchAccessToken, localStorage],
	);

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
		</trpc.Provider>
	);
}
