'use server';

import { getUserById } from '@lumi/core/users/users.service';

import { auth } from '@/auth';

export const getUserBySession = async () => {
	const session = await auth();
	if (!session) return undefined;
	return getUserById(session.user.id!);
};
