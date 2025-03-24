'use server';

import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '../supabase/server';

export const requireSpotifyLink = async () => {
	const supabase = await createSupabaseServerClient();
	const { data: identityData, error } = await supabase.auth.getUserIdentities();

	if (error) redirect(`/home?error=${encodeURIComponent('Could not fetch user identities!')}`);

	return identityData.identities.find(identity => identity.provider === 'spotify');
};
