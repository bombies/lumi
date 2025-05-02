'use client';

import InfiniteLoader from '@/components/ui/infinite-loader';

import { Separator } from '@/components/ui/separator';
import { GetReceivedAffirmations } from '@/hooks/trpc/affirmation-hooks';
import { flattenPages } from '@/lib/utils';
import { useMemo } from 'react';
import AffirmationGroupSkeleton from './affirmation-group-skeleton';
import MostRecentAffirmationSkeleton from './most-recent-affirmation-skeleton';

const ReceivedAffirmationsContainer = () => {
	const {
		data: pages,
		isLoading: dataLoading,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage,
	} = GetReceivedAffirmations();

	const flatPages = useMemo(() => {
		const data = flattenPages(pages?.pages);

		return Object.groupBy(data, ({ timestamp }) => timestamp.split('T')[0]);
	}, [pages?.pages]);

	const todaysAffirmation = useMemo(() => {
		const data = flattenPages(pages?.pages);
		const today = new Date().toISOString().split('T')[0];
		return data.splice(
			data.findLastIndex(affirmation => affirmation.timestamp === today),
			1,
		)[0];
	}, [pages?.pages]);

	const affirmationElements = useMemo(
		() =>
			Object.entries(flatPages).map(([timestamp, affirmations]) => {
				if (!affirmations) return undefined;
				const timestampDatetime = new Date(timestamp).toISOString();
				const timestampDate = timestampDatetime.split('T')[0];
				const header
					= timestampDate === new Date().toISOString().split('T')[0]
						? 'Today'
						: timestampDate
							=== new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0]
							? 'Yesterday'
							: new Date(timestamp).toLocaleDateString('en-US', {
									dateStyle: 'full',
								});

				return (
					<div className="space-y-2" key={`affirmation#${timestamp}`}>
						<h3 className="text-xl text-secondary font-medium">{header}</h3>
						<Separator className="bg-secondary" />
						{affirmations.map(affirmationData => (
							<div className="flex items-start gap-2" key={`affirmation#${affirmationData.timestamp}`}>
								<p className="text-xs text-foreground/20 shrink-0">
									{new Date(affirmationData.timestamp).toLocaleTimeString('en-US', {
										timeStyle: 'short',
									})}
								</p>
								<p className="text-lg">
									&ldquo;
									{affirmationData.affirmation}
									&rdquo;
								</p>
							</div>
						))}
					</div>
				);
			}),
		[flatPages],
	);

	return (
		<div className="space-y-6 max-w-full tablet:max-w-[45rem]">
			{dataLoading
				? (
						<>
							<MostRecentAffirmationSkeleton />
							<div className="space-y-8">
								<AffirmationGroupSkeleton />
								<AffirmationGroupSkeleton />
								<AffirmationGroupSkeleton />
							</div>
						</>
					)
				: todaysAffirmation || affirmationElements.length > 0
					? (
							<>
								{todaysAffirmation && (
									<div className="w-full rounded-xl bg-primary text-primary-foreground p-6 tablet:w-96 space-y-4">
										<h3 className="text-xl font-bold">Most Recent Affirmation</h3>
										<p className="text-lg">
											&ldquo;
											{todaysAffirmation.affirmation}
											&rdquo;
										</p>
									</div>
								)}
								<div className="space-y-3">{affirmationElements}</div>
							</>
						)
					: (
							<p className="p-6 rounded-lg border border-border border-dashed font-mono w-fit font-semibold">
								No affirmations received...
							</p>
						)}
			<InfiniteLoader loading={isFetchingNextPage} hasMore={hasNextPage} fetchMore={fetchNextPage} />
		</div>
	);
};

export default ReceivedAffirmationsContainer;
