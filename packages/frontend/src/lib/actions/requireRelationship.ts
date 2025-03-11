'use server';

import { redirect } from 'next/navigation';
import { getRelationshipForUser } from '@lumi/core/relationships/relationship.service';

import { auth } from '@/auth';

export const requireRelationship = async () => {
	const session = await auth();
	if (!session) redirect('/auth/login');

	const relationship = await getRelationshipForUser(session.user.id!);
	if (!relationship) redirect('/join');
	return relationship;
};
