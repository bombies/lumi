'use server';

import { headers } from 'next/headers';

import { auth } from '@/auth';

export type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

export const getServerSession = async () => {
	return auth.api.getSession({
		headers: await headers(),
	});
};
