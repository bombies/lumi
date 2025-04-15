'use server';

import { redirect } from 'next/navigation';
import { getRelationshipForUser } from '@lumi/core/relationships/relationship.service';
import { Relationship } from '@lumi/core/relationships/relationship.types';
import { createUser, getUserById } from '@lumi/core/users/users.service';

import { getSelfUser, getServerSession, signOut } from '../better-auth/auth-actions';

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

	if (args?.withSelf) {
		relationship.self = await getUserById(session.user.id, { throws: false });

		if (!relationship.self) {
			const self = await getSelfUser();
			if (!self) {
				await signOut();
				redirect('/auth/login');
			}

			const [firstName, lastName] = self.name.split(' ');
			await createUser({
				id: session.user.id,
				email: session.user.email,
				username: self.username,
				firstName,
				lastName,
				args: {
					sendOTP: false,
				},
			});
		}
	}

	return relationship;
};
