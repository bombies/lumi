'use server';

import { headers } from 'next/headers';
import { BetterAuthDatabaseUser } from '@lumi/core/auth/better-auth.types';

import { auth, db } from '@/auth';

export type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

export const getServerSession = async () => {
	return auth.api.getSession({
		headers: await headers(),
	});
};

export const getSelfUser = async () => {
	const session = await getServerSession();
	if (!session) return null;

	const res = await db.query<BetterAuthDatabaseUser>('SELECT * FROM "user" WHERE "id"=$1::text', [session.user.id]);
	return res.rows[0];
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
