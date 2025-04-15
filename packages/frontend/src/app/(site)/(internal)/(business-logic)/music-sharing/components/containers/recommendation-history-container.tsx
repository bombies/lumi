'use client';

import { FC, useMemo } from 'react';
import { RefreshCwIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import InfiniteLoader from '@/components/ui/infinite-loader';
import { Separator } from '@/components/ui/separator';
import { GetSongRecommendations } from '@/hooks/trpc/music-sharing-hooks';
import RecommendedTrack from '../tracks/recommended-track';
import TrackSearchResultSkeleton from '../tracks/track-search-result-skeleton';

const RecommendationHistoryContainer: FC = () => {
	const {
		data: songRecs,
		isLoading: songRecsLoading,
		isRefetching: songRecsRefetching,
		refetch: refetchSongRecs,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = GetSongRecommendations({ fetchType: 'relationship', order: 'desc', filter: 'listened' });

	const recElems = useMemo(
		() =>
			songRecs?.pages
				.flatMap(page => page.data)
				.map(track => <RecommendedTrack key={`rec_track_${track.id}`} track={track} type="listened" />),
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
					onClick={() => refetchSongRecs()}
				>
					<RefreshCwIcon size={18} />
				</Button>
			</div>
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
				<p className="text-lg">No recommendations have been listened to yet...</p>
			)}
		</div>
	);
};

export default RecommendationHistoryContainer;
