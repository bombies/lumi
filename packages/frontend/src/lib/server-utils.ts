'use server';

import { getUserById } from '@lumi/core/users/users.service';

import { getServerSession } from './supabase/server';

export const getUserBySession = async () => {
	const session = await getServerSession();
	if (!session) return undefined;
	return getUserById(session.id);
};
