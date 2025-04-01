'use client';

import { Fragment, useMemo, useState } from 'react';
import { ReceivedAffirmation } from '@lumi/core/types/affirmations.types';

import InfiniteLoader from '@/components/ui/infinite-loader';
import { Separator } from '@/components/ui/separator';
import Spinner from '@/components/ui/spinner';
import { GetReceivedAffirmations } from '@/hooks/trpc/affirmation-hooks';
import { flattenPages } from '@/lib/utils';

const ReceivedAffirmationsContainer = () => {
	const {
		data: pages,
		isLoading: dataLoading,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage,
	} = GetReceivedAffirmations();
	const [todaysAffirmation, setTodaysAffirmation] = useState<ReceivedAffirmation>();

	const flatPages = useMemo(() => {
		const data = flattenPages(pages?.pages);
		const today = new Date().toISOString().split('T')[0];
		const todaysAffirmation = data.splice(
			data.findIndex(affirmation => affirmation.timestamp === today),
			1,
		)[0];
		setTodaysAffirmation(todaysAffirmation);

		return Object.groupBy(data, ({ timestamp }) => timestamp.split('T')[0]);
	}, [pages?.pages]);

	const affirmationElements = useMemo(
		() =>
			Object.entries(flatPages).map(([timestamp, affirmations]) => {
				if (!affirmations) return undefined;
				const timestampDatetime = new Date(timestamp).toISOString();
				const timestampDate = timestampDatetime.split('T')[0];
				const header =
					timestampDate === new Date().toISOString().split('T')[0]
						? 'Today'
						: timestampDate ===
							  new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0]
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
								<p className="text-lg">&ldquo;{affirmationData.affirmation}&rdquo;</p>
							</div>
						))}
					</div>
				);
			}),
		[flatPages],
	);

	return (
		<>
			{dataLoading ? (
				<>
					<Spinner />
				</>
			) : todaysAffirmation || affirmationElements.length > 0 ? (
				<div className="space-y-6 max-w-full tablet:max-w-[45rem]">
					{todaysAffirmation && (
						<div className="w-full rounded-xl bg-primary text-primary-foreground p-6 tablet:w-96 space-y-4">
							<h3 className="text-xl font-bold">Most Recent Affirmation</h3>
							<p className="text-lg">&ldquo;{todaysAffirmation.affirmation}&rdquo;</p>
						</div>
					)}
					<div className="space-y-3">{affirmationElements}</div>
				</div>
			) : (
				<p className="p-6 rounded-lg border border-border w-fit font-semibold">No affirmations received...</p>
			)}
			<InfiniteLoader loading={isFetchingNextPage} hasMore={hasNextPage} fetchMore={fetchNextPage} />
		</>
	);
};

export default ReceivedAffirmationsContainer;
