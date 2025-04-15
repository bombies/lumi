'use server';

import { redirect } from 'next/navigation';
import { getRelationshipForUser } from '@lumi/core/relationships/relationship.service';
import { Relationship } from '@lumi/core/relationships/relationship.types';
import { getUserById } from '@lumi/core/users/users.service';

import { getServerSession } from '../better-auth/auth-actions';

type RequireRelationshipArgs = {
	withPartner?: boolean;
	withSelf?: boolean;
};

export const requireRelationship = async (args?: RequireRelationshipArgs): Promise<Relationship> => {
	const session = await getServerSession();
	if (!session) redirect('/auth/login');

	if (!session.user.emailVerified) redirect('/auth/register/confirm');

	const relationship = await getRelationshipForUser(session.user.id);
	if (!relationship) redirect('/join');

	if (args?.withPartner) {
		const partnerId = relationship.partner1 === session.user.id ? relationship.partner2 : relationship.partner1;
		const partner = await getUserById(partnerId);
		relationship.partner = partner;
	}

	if (args?.withSelf) relationship.self = await getUserById(session.user.id);

	return relationship;
};
