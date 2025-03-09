'use server';

import { cache } from 'react';
import { headers } from 'next/headers';
import { appRouter } from '@lumi/functions/router';
import { createCallerFactory } from '@lumi/functions/utils/trpc';
import { createHydrationHelpers } from '@trpc/react-query/rsc';
import { User } from 'next-auth';

import { auth } from '@/auth';
import { makeQueryClient } from './query-client';

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);

const createContext = cache(async () => {
	const session = await auth();
	const reqHeaders = (await headers()).entries().reduce(
		(acc, [key, value]) => {
			acc[key] = value;
			return acc;
		},
		{} as Record<string, string>,
	);

	return { user: session?.user as Required<User> | null, headers: reqHeaders };
});

const caller = createCallerFactory(appRouter)(createContext);
export const { trpc, HydrateClient } = createHydrationHelpers<typeof appRouter>(caller, getQueryClient);
