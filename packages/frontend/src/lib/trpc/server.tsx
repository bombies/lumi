'use server';

import { cache } from 'react';
import { headers } from 'next/headers';
import { appRouter } from '@lumi/functions/router';
import { createCallerFactory } from '@lumi/functions/utils/trpc';
import { createHydrationHelpers } from '@trpc/react-query/rsc';

import { getServerSession } from '../better-auth/auth-actions';
import { makeQueryClient } from './query-client';

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = async () => cache(makeQueryClient);

const createContext = cache(async () => {
	const sessionData = await getServerSession();
	const reqHeaders = (await headers()).entries().reduce(
		(acc, [key, value]) => {
			acc[key] = value;
			return acc;
		},
		{} as Record<string, string>,
	);

	reqHeaders['authorization'] = `Bearer ${sessionData?.session?.token}`;
	return { headers: reqHeaders };
});

const caller = createCallerFactory(appRouter)(createContext);
export const getHydrationHelpers = async () => createHydrationHelpers<typeof appRouter>(caller, await getQueryClient());
