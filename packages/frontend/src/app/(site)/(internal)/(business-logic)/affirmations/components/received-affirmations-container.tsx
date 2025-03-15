'use client';

import { Fragment, useMemo, useState } from 'react';
import { ReceivedAffirmation } from '@lumi/core/types/affirmations.types';

import InfiniteLoader from '@/components/ui/infinite-loader';
import { Separator } from '@/components/ui/separator';
import Spinner from '@/components/ui/spinner';
import { flattenPages } from '@/lib/utils';
import { GetReceivedAffirmations } from '../hooks';

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
		const data = flattenPages(pages?.pages).map(affirmation => ({
			...affirmation,
			timestamp: affirmation.timestamp.slice(0, 10),
		}));

		const today = new Date().toISOString().slice(0, 10);
		const todaysAffirmation = data.splice(
			data.findIndex(affirmation => affirmation.timestamp === today),
			1,
		)[0];
		setTodaysAffirmation(todaysAffirmation);

		return Object.groupBy(data, ({ timestamp }) => timestamp);
	}, [pages?.pages]);

	const affirmationElements = useMemo(
		() =>
			Object.entries(flatPages).map(([timestamp, affirmations]) => {
				if (!affirmations) return undefined;

				return (
					<div className="sapce-y-2" key={`affirmation#${timestamp}`}>
						<h3 className="text-xl text-secondary font-medium">
							{new Date(timestamp).toLocaleDateString('en-US', {
								dateStyle: 'full',
							})}
						</h3>
						<Separator className="bg-secondary" />
						{affirmations.map((affirmation, idx) => (
							<p className="text-lg" key={`affirmation#${timestamp}#${idx}`}>
								{affirmation.affirmation}
							</p>
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
							<h3 className="text-xl font-bold">Today&apos;s Affirmation</h3>
							<p className="text-lg">{todaysAffirmation.affirmation}</p>
						</div>
					)}
					<div className="space-y-3">{affirmationElements}</div>
				</div>
			) : (
				<p>No affirmations received...</p>
			)}
			<InfiniteLoader loading={isFetchingNextPage} hasMore={hasNextPage} fetchMore={fetchNextPage} />
		</>
	);
};

export default ReceivedAffirmationsContainer;
