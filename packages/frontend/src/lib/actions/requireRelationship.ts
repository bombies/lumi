'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getRelationshipForUser } from '@lumi/core/relationships/relationship.service';
import { getToken } from 'next-auth/jwt';

import { auth } from '@/auth';

export const requireRelationship = async () => {
	const session = await auth();
	if (!session) redirect('/auth/login');

	const pageHeaders = await headers();
	const headerRecord = pageHeaders
		.entries()
		.reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as Record<string, string>);

	const token = await getToken({
		req: { headers: headerRecord },
		secret: process.env.AUTH_SECRET,
		cookieName: process.env.NODE_ENV === 'production' ? '__Secure-authjs.session-token' : undefined,
	});

	const relationship = await getRelationshipForUser(token!.user.id!);
	if (!relationship) redirect('/join');
	return relationship;
};
