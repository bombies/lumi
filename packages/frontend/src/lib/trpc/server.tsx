'use server';

import { cache } from 'react';
import { appRouter } from '@lumi/functions/router';
import { createCallerFactory } from '@lumi/functions/utils/trpc';
import { createHydrationHelpers } from '@trpc/react-query/rsc';
import { User } from 'next-auth';

import { auth } from '@/auth';
import { makeQueryClient } from './query-client';

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);

const createContext: () => Promise<{ user?: Required<User> | null }> = cache(async () => {
	const session = await auth();
	return { user: session?.user as Required<User> | null };
});

const caller = createCallerFactory(appRouter)(createContext);
export const { trpc, HydrateClient } = createHydrationHelpers<typeof appRouter>(caller, getQueryClient);
