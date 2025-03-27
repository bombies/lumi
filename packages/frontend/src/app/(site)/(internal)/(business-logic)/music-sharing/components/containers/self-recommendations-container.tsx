'use client';

import { FC, useMemo } from 'react';

import InfiniteLoader from '@/components/ui/infinite-loader';
import { Separator } from '@/components/ui/separator';
import { GetSongRecommendations } from '@/hooks/trpc/music-sharing-hooks';
import RecommendSongButton from '../recommend-song-button';
import RecommendedTrack from '../tracks/recommended-track';
import TrackSearchResultSkeleton from '../tracks/track-search-result-skeleton';

const SelfRecommendationsContainer: FC = () => {
	const {
		data: songRecs,
		isLoading: songRecsLoading,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage,
	} = GetSongRecommendations({ self: true, order: 'desc', filter: 'unlistened' });

	const recElems = useMemo(
		() =>
			songRecs?.pages
				.flatMap(page => page.data)
				.map(track => <RecommendedTrack key={`rec_track_${track.id}`} track={track} type="sender" />),
		[songRecs?.pages],
	);

	return (
		<div className="space-y-6">
			<RecommendSongButton />
			<Separator />
			{songRecsLoading ? (
				<div>
					<div className="space-y-3">
						<TrackSearchResultSkeleton />
						<TrackSearchResultSkeleton />
						<TrackSearchResultSkeleton />
						<TrackSearchResultSkeleton />
						<TrackSearchResultSkeleton />
					</div>
				</div>
			) : recElems?.length ? (
				<div className="space-y-3">
					{recElems}
					<InfiniteLoader hasMore={hasNextPage} fetchMore={fetchNextPage} loading={isFetchingNextPage} />
				</div>
			) : (
				<p className="text-lg">You have not recommended new any songs...</p>
			)}
		</div>
	);
};

export default SelfRecommendationsContainer;
