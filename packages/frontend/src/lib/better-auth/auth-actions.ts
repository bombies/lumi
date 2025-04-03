'use server';

import { headers } from 'next/headers';

import { auth } from '@/auth';

export type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

export const getServerSession = async () => {
	return auth.api.getSession({
		headers: await headers(),
	});
};

export const revokeCurrentSession = async () => {
	const session = await getServerSession();
	if (!session) return;
	return auth.api.revokeSession({
		headers: await headers(),
		body: {
			token: session.session.token,
		},
	});
};

export const signOut = async () => {
	const session = await getServerSession();
	if (!session) return;
	return auth.api.signOut({
		headers: await headers(),
	});
};
