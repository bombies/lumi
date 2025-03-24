import { FC } from 'react';
import { SiSpotify } from '@icons-pack/react-simple-icons';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import SpotifyLinkButton from './spotify-link-button';
import SpotifyUnlinkButton from './spotify-unlink-button';

const MusicSharingSettingsContent: FC = async () => {
	const supabase = await createSupabaseServerClient();
	const { data, error } = await supabase.auth.getUserIdentities();

	if (error) throw error;

	const spotifyIdentity = data.identities.find(identity => identity.provider === 'spotify');
	return (
		<Card className="bg-accent border border-border">
			<CardHeader>
				<CardTitle className="flex items-center">
					<SiSpotify className="mr-2" /> <p>Your Spotify Account</p>
				</CardTitle>
			</CardHeader>
			<CardContent>
				{spotifyIdentity ? (
					<div className="space-y-4">
						<p className="text-sm text-text-secondary">Your spotify account is linked.</p>{' '}
						<SpotifyUnlinkButton spotifyIdentity={spotifyIdentity} />
					</div>
				) : (
					<div className="space-y-4">
						<p className="text-sm text-text-secondary">You have not linked your spotify account.</p>
						<SpotifyLinkButton next="/settings/relationship" />
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default MusicSharingSettingsContent;
