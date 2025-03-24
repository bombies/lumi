'use client';

import { FC } from 'react';
import { SiSpotify } from '@icons-pack/react-simple-icons';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SpotifyLinkButton from '../../../settings/relationship/components/music-sharing/spotify-link-button';
import ShareMusicContainer from './share-music-container';
import { useSpotifyData } from './spotify-provider';

const MusicSharingContent: FC = () => {
	const { isLinked } = useSpotifyData();
	return isLinked ? (
		<ShareMusicContainer />
	) : (
		<Card className="tablet:w-fit" glass>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<SiSpotify /> <p>Your Spotify Account</p>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<p className="text-sm text-text-secondary">You have not linked your spotify account.</p>
					<SpotifyLinkButton next="/music-sharing" />
				</div>
			</CardContent>
		</Card>
	);
};

export default MusicSharingContent;
