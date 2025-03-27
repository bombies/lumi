'use server';

import { getUserById } from '@lumi/core/users/users.service';

import { getServerSession } from './better-auth/auth-actions';

export const getUserBySession = async () => {
	const session = await getServerSession();
	if (!session) return undefined;
	return getUserById(session.user.id);
};
