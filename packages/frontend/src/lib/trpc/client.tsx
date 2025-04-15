'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { AppRouter } from '@lumi/functions/types';
import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, TRPCClientError } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';

import { auth } from '../better-auth/auth-client';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { logger } from '../logger';
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
	const localStorage = useLocalStorage();
	const storageRef = useRef(localStorage);
	// NOTE: Avoid useState when initializing the query client if you don't
	//       have a suspense boundary between this and the code that may
	//       suspend because React will throw away the client on the initial
	//       render if it suspends and there is no boundary

	useEffect(() => {
		storageRef.current = localStorage;
	}, [localStorage]);

	const setAccessToken = useCallback(async () => {
		if (!localStorage) return;

		logger.debug('Setting a new access token...');
		const session = await auth.getSession();

		if (session.error || !session.data) {
			logger.debug('User is not authenticated! Could not set an access token.');
			return;
		}

		const response = await fetch('/api/auth/token', {
			headers: {
				Authorization: `Bearer ${session.data?.session.token}`,
			},
		});

		const token = (await response.json()).token;
		if (token) localStorage.setItemRaw('auth-jwt', token);
		return token as string | undefined;
	}, [localStorage]);

	useEffect(() => {
		if (!localStorage) return;

		(async () => {
			const existingToken = localStorage.getItemRaw('auth-jwt');
			if (existingToken) return;
			await setAccessToken();
		})();
	}, [localStorage, setAccessToken]);

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
							const accessToken = storageRef.current?.getItemRaw('auth-jwt');

							return {
								authorization: accessToken ? `Bearer ${accessToken}` : '',
							};
						},
						fetch: async (url, options) => {
							const response = await fetch(url, options);
							if (response.status === 401) {
								const error = (await response.json()) as { error: TRPCClientError<AppRouter> }[];
								const errMsg = error[0].error.message;
								logger.debug('TRPC fetch error', errMsg);
								if (errMsg.includes('expired')) {
									const newToken = await setAccessToken();
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

									let storage = storageRef.current;
									while (!storage) {
										storage = storageRef.current;
										logger.debug('Waiting for localStorage to be available...');
									}
									logger.debug('localStorage is available!');

									let accessToken = storage.getItemRaw('auth-jwt');
									logger.debug(`Retrying request with token: ${accessToken}`);

									if (!accessToken) {
										logger.debug(
											"The access token doesn't exist... Attempting to create a new one",
										);
										accessToken = (await setAccessToken()) ?? null;

										if (!accessToken) {
											logger.debug('Could not create a new access token!');
										} else {
											logger.debug(
												`New access token created: ${accessToken}. Using it in the retried request.`,
											);
										}
									}

									return await fetch(url, {
										...options,
										headers: {
											...options?.headers,
											Authorization: accessToken ? `Bearer ${accessToken}` : '',
										},
									});
								}
							}
							return response;
						},
					}),
				],
			}),
		[setAccessToken],
	);

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
		</trpc.Provider>
	);
}
