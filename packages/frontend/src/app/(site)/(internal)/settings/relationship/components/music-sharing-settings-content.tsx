import { FC } from 'react';
import { SiSpotify } from '@icons-pack/react-simple-icons';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import SpotifyLinkButton from './spotify-link-button';

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
					<p className="text-sm text-text-secondary">
						Connected as <span className="font-medium">{spotifyIdentity.user_id}</span>
					</p>
				) : (
					<div className="space-y-4">
						<p className="text-sm text-text-secondary">Not connected</p>
						<SpotifyLinkButton />
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default MusicSharingSettingsContent;
