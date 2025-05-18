'use client';

import type { FC } from 'react';
import { useEffect } from 'react';

import { useRelationship } from '@/components/providers/relationships/relationship-provder';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GetSongRecommendations } from '@/hooks/trpc/music-sharing-hooks';
import RecommendSongButton from '../recommend-song-button';
import PartnerRecommendationsContainer from './partner-recommendations-container';
import RecommendationHistoryContainer from './recommendation-history-container';
import SelfRecommendationsContainer from './self-recommendations-container';

const ShareMusicContainer: FC = () => {
	const { partner } = useRelationship();
	const { data: songRecs } = GetSongRecommendations({ order: 'desc', limit: 1, filter: 'unlistened' });

	useEffect(() => {
		const latestSong = songRecs?.pages.at(0)?.data.at(0)?.track.albumImage;
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

		return () => {
			bodyElement.style.backgroundImage = '';
			bodyElement.style.width = '';
			bodyElement.style.height = '';
		};
	}, [songRecs?.pages]);

	return (
		<Card className="tablet:w-[45rem]" glass>
			<CardTitle hidden>Share Music</CardTitle>
			<CardContent className="space-y-6">
				<h3 className="font-bold text-xl">Song Recommendations</h3>
				<RecommendSongButton />
				<Tabs defaultValue="partner-recs">
					<TabsList className="grid w-full grid-cols-2 tablet:grid-cols-3">
						<TabsTrigger value="partner-recs">
							{partner.firstName}
							&apos;s
						</TabsTrigger>
						<TabsTrigger value="self-recs">Yours</TabsTrigger>
						<TabsTrigger value="history" className="col-span-2 tablet:col-span-1">
							Recommendation History
						</TabsTrigger>
					</TabsList>
					<TabsContent value="partner-recs">
						<PartnerRecommendationsContainer />
					</TabsContent>
					<TabsContent value="self-recs">
						<SelfRecommendationsContainer />
					</TabsContent>
					<TabsContent value="history">
						<RecommendationHistoryContainer />
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
};

export default ShareMusicContainer;
