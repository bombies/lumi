'use server';

import { redirect } from 'next/navigation';
import { getRelationshipForUser } from '@lumi/core/relationships/relationship.service';
import { Relationship } from '@lumi/core/types/relationship.types';
import { User } from '@lumi/core/types/user.types';
import { getUserById } from '@lumi/core/users/users.service';

import { getServerSession } from '../supabase/server';

type RequireRelationshipArgs = {
	withPartner?: boolean;
};

export const requireRelationship = async (
	args?: RequireRelationshipArgs,
): Promise<Relationship & { partner?: User }> => {
	const session = await getServerSession();
	if (!session) redirect('/auth/login');

	const relationship = await getRelationshipForUser(session.id);
	if (!relationship) redirect('/join');

	if (args?.withPartner) {
		const partnerId = relationship.partner1 === session.id ? relationship.partner2 : relationship.partner1;
		const partner = await getUserById(partnerId);
		return { ...relationship, partner };
	}
	return relationship;
};
