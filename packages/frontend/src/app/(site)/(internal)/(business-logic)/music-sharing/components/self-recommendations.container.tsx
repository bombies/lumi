'use client';

import { FC } from 'react';

import { GetSongRecommendations } from '@/hooks/trpc/music-sharing-hooks';
import RecommendSongButton from './recommend-song-button';

const SelfRecommendationsContainer: FC = () => {
	const { data: songRecs, isLoading: songRecsLoading } = GetSongRecommendations({ self: true, order: 'desc' });
	return (
		<div>
			<RecommendSongButton />
		</div>
	);
};

export default SelfRecommendationsContainer;
