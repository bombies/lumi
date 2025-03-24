'use client';

import { FC, useEffect } from 'react';

import { Card, CardContent, CardTitle } from '@/components/ui/card';
import useSpotifyQuery from '@/lib/hooks/spotify/useSpotifyQuery';

const ShareMusicContainer: FC = () => {
	const { data, isLoading } = useSpotifyQuery('recently-played-tracks', api => api.player.getRecentlyPlayedTracks(1));

	useEffect(() => {
		console.log(data?.items[0].track.album.images);
		const latestSong = data?.items[0].track.album.images[0].url;
		if (!latestSong) return;

		const bodyElement = document.querySelector('body');
		if (!bodyElement) return;

		bodyElement.style.backgroundImage = `url(${latestSong})`;
		bodyElement.style.backgroundSize = 'cover';
		bodyElement.style.backgroundRepeat = 'no-repeat';
		bodyElement.style.backgroundAttachment = 'fixed';
		bodyElement.style.backgroundPosition = 'center';
		bodyElement.style.width = '100vw';
		bodyElement.style.height = '100vh';
	}, [data?.items]);

	return (
		<Card className="tablet:w-[45rem]" glass>
			<CardTitle hidden>Share Music</CardTitle>
			<CardContent>
				<h3 className="font-bold text-xl">Song Recommendations</h3>
			</CardContent>
		</Card>
	);
};

export default ShareMusicContainer;
