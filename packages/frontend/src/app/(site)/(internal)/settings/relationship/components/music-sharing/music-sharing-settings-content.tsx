'use client';

import type { FC } from 'react';
import { SiSpotify } from '@icons-pack/react-simple-icons';
import { useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GetUserAccounts } from '@/lib/better-auth/auth-hooks';
import SpotifyLinkButton from './spotify-link-button';
import SpotifyUnlinkButton from './spotify-unlink-button';

const MusicSharingSettingsContent: FC = () => {
	const { data: accounts } = GetUserAccounts();

	const spotifyIdentity = useMemo(
		() => accounts?.data?.find(account => account.provider === 'spotify'),
		[accounts?.data],
	);
	return (
		<Card className="bg-accent border border-border">
			<CardHeader>
				<CardTitle className="flex items-center">
					<SiSpotify className="mr-2" />
					{' '}
					<p>Your Spotify Account</p>
				</CardTitle>
			</CardHeader>
			<CardContent>
				{spotifyIdentity
					? (
							<div className="space-y-4">
								<p className="text-sm text-text-secondary">Your spotify account is linked.</p>
								{' '}
								<SpotifyUnlinkButton spotifyIdentity={spotifyIdentity} />
							</div>
						)
					: (
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
