'use client';

import { FC, useEffect } from 'react';

import { useRelationship } from '@/components/providers/relationships/relationship-provder';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useSpotifyQuery from '@/lib/hooks/spotify/useSpotifyQuery';
import SelfRecommendationsContainer from './self-recommendations.container';

const ShareMusicContainer: FC = () => {
	const { partner } = useRelationship();
	const { data } = useSpotifyQuery('recently-played-tracks', api => api.player.getRecentlyPlayedTracks(1));

	useEffect(() => {
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
			<CardContent className="space-y-6">
				<h3 className="font-bold text-xl">Song Recommendations</h3>
				<Tabs defaultValue="partner-recs">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="partner-recs">{partner.firstName}&apos;s</TabsTrigger>
						<TabsTrigger value="self-recs">Yours</TabsTrigger>
					</TabsList>
					<TabsContent value="partner-recs"></TabsContent>
					<TabsContent value="self-recs">
						<SelfRecommendationsContainer />
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
};

export default ShareMusicContainer;
