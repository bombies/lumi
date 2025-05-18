'use client';

import type { FC } from 'react';
import { RefreshCwIcon } from 'lucide-react';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import InfiniteLoader from '@/components/ui/infinite-loader';
import { Separator } from '@/components/ui/separator';
import { GetSongRecommendations } from '@/hooks/trpc/music-sharing-hooks';
import { useRouteInvalidation } from '@/lib/hooks/useRouteInvalidation';
import { trpc } from '@/lib/trpc/trpc-react';
import RecommendedTrack from '../tracks/recommended-track';
import TrackSearchResultSkeleton from '../tracks/track-search-result-skeleton';

const PartnerRecommendationsContainer: FC = () => {
	const {
		data: songRecs,
		isLoading: songRecsLoading,
		isRefetching: songRecsRefetching,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = GetSongRecommendations({ order: 'desc', filter: 'unlistened' });
	const invalidateSongRecs = useRouteInvalidation([trpc.musicSharing.getSongRecommendations]);

	const recElems = useMemo(
		() =>
			songRecs?.pages
				.flatMap(page => page.data)
				.map(track => <RecommendedTrack key={`rec_track_${track.id}`} track={track} type="receiver" />),
		[songRecs?.pages],
	);

	return (
		<div className="space-y-6">
			<Separator />
			<div className="flex">
				<Button
					size="icon"
					loading={songRecsRefetching}
					disabled={songRecsLoading}
					onClick={() => invalidateSongRecs()}
				>
					<RefreshCwIcon size={18} />
				</Button>
			</div>
			{songRecsLoading
				? (
						<div>
							<div className="space-y-3">
								<TrackSearchResultSkeleton />
								<TrackSearchResultSkeleton />
								<TrackSearchResultSkeleton />
								<TrackSearchResultSkeleton />
								<TrackSearchResultSkeleton />
							</div>
						</div>
					)
				: recElems?.length
					? (
							<div className="space-y-3">
								{recElems}
								<InfiniteLoader hasMore={hasNextPage} fetchMore={fetchNextPage} loading={isFetchingNextPage} />
							</div>
						)
					: (
							<p className="text-lg">You have not received any new song recommendations...</p>
						)}
		</div>
	);
};

export default PartnerRecommendationsContainer;
