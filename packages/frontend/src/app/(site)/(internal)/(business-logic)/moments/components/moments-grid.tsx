'use client';

import { FC, useMemo } from 'react';

import InfiniteLoader from '@/components/ui/infinite-loader';
import { GetMoments } from '@/hooks/trpc/moment-hooks';
import MomentCard from './moment-card';
import MomentCardSkeleton from './moment-card-skeleton';

const MomentsGrid: FC = () => {
	const {
		data: momentPages,
		isLoading: momentsLoading,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage,
	} = GetMoments();

	const moments = useMemo(() => momentPages?.pages.flatMap(page => page.data), [momentPages?.pages]);

	const momentElements = useMemo(
		() => moments?.map(moment => <MomentCard key={moment.id} moment={moment} />),
		[moments],
	);

	return (
		<div>
			<div className="grid phone-big:grid-cols-2 laptop:grid-cols-3 desktop:grid-cols-4 gap-4">
				{momentsLoading ? (
					<>
						<MomentCardSkeleton />
						<MomentCardSkeleton />
						<MomentCardSkeleton />
						<MomentCardSkeleton />
						<MomentCardSkeleton />
						<MomentCardSkeleton />
					</>
				) : momentElements?.length ? (
					momentElements
				) : (
					<div className="tablet:pt-6 tablet:pl-6">
						<p className="text-3xl font-semibold mb-3">There's nothing here yet...</p>
						<p>
							<span className="font-bold text-primary">Tip:</span> Start sharing memories by clicking the
							"Upload Moment" button!
						</p>
					</div>
				)}
			</div>
			<InfiniteLoader hasMore={hasNextPage} loading={isFetchingNextPage} fetchMore={fetchNextPage} />
		</div>
	);
};

export default MomentsGrid;
