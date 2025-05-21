'use client';

import type { Moment } from '@lumi/core/moments/moment.types';
import type { FC } from 'react';
import { Separator } from '@radix-ui/react-separator';
import { useMemo } from 'react';

import InfiniteLoader from '@/components/ui/infinite-loader';
import MomentCard from './moment-card';
import MomentCardSkeleton from './moment-card-skeleton';

type Props = {
	moments?: Moment[];
	momentPages?: { pages: { data: Moment[] }[] };
	momentsLoading?: boolean;
	isSearching?: boolean;
	searchActive?: boolean;
	infiniteOpts?: {
		hasNextPage: boolean;
		fetchNextPage: () => void;
		isFetchingNextPage: boolean;
	};
};

const MomentsGridContent: FC<Props> = ({
	moments: momentArr,
	momentPages,
	momentsLoading,
	infiniteOpts,
	isSearching,
	searchActive,
}) => {
	const moments = useMemo(() => {
		if (momentArr) return momentArr;
		const flatMoments = momentPages?.pages.flatMap(page => page.data);
		const dedupedMoments = flatMoments?.reduce(
			(acc, moment) => {
				if (!acc.some(existingMoment => existingMoment.id === moment.id)) acc.push(moment);

				return acc;
			},
			[] as typeof flatMoments,
		);
		return dedupedMoments?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	}, [momentArr, momentPages?.pages]);

	const momentElements = useMemo(
		() => moments?.map(moment => <MomentCard key={moment.id} moment={moment} />),
		[moments],
	);

	return (
		<div>
			<Separator className="my-6" />
			<div className="grid phone-big:grid-cols-2 tablet:grid-cols-3 laptop:grid-cols-4 desktop:grid-cols-5 gap-4">
				{isSearching || momentsLoading
					? (
							<>
								<MomentCardSkeleton />
								<MomentCardSkeleton />
								<MomentCardSkeleton />
								<MomentCardSkeleton />
								<MomentCardSkeleton />
								<MomentCardSkeleton />
							</>
						)
					: momentElements?.length
						? (
								momentElements
							)
						: (
								<div className="tablet:pt-6 tablet:pl-6">
									<p className="text-3xl font-semibold mb-3">
										{searchActive ? 'No results.' : 'There\'s nothing here yet...'}
									</p>
									<p>
										<span className="font-bold text-primary">Tip:</span>
										{' '}
										Start sharing memories by clicking the
										"Upload Moment" button!
									</p>
								</div>
							)}
			</div>
			{infiniteOpts && (
				<InfiniteLoader
					hasMore={infiniteOpts.hasNextPage}
					loading={infiniteOpts.isFetchingNextPage}
					fetchMore={infiniteOpts.fetchNextPage}
				/>
			)}
		</div>
	);
};

export default MomentsGridContent;
