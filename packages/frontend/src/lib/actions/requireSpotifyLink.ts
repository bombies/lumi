'use server';

import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { getServerSession } from '../better-auth/auth-actions';

export const requireSpotifyLink = async () => {
	const session = await getServerSession();
	try {
		const identityData = await auth.api.listUserAccounts({
			headers: {
				Authorization: `Bearer ${session?.session.token}`,
			},
		});
		return identityData.find(identity => identity.provider === 'spotify');
	} catch (e) {
		console.error(e);
		redirect(`/home?error=${encodeURIComponent('Could not fetch user identities!')}`);
	}
};
