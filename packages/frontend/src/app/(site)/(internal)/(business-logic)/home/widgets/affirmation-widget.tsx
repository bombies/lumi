'use client';

import { FC, Fragment, useMemo } from 'react';
import Link from 'next/link';
import { HeartIcon } from '@heroicons/react/24/solid';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { GetTodaysAffirmations } from '@/hooks/trpc/affirmation-hooks';

const AffirmationWidget: FC = () => {
	const { data: todaysAffirmations, isLoading: affirmationsLoading } = GetTodaysAffirmations();

	const affirmationElements = useMemo(
		() =>
			todaysAffirmations?.data.map(affirmationData => (
				<Fragment key={`affirmation#${affirmationData.timestamp}`}>
					<p className="break-words">&ldquo;{affirmationData.affirmation}&rdquo;</p>
					<Separator className="mt-2" />
				</Fragment>
			)),
		[todaysAffirmations?.data],
	);

	return (
		<div className="max-w-[45rem] rounded-md bg-primary p-6 space-y-4">
			<h3 className="font-bold text-2xl">
				Today&apos;s Affirmation{(affirmationElements?.length ?? 0 > 1) ? 's' : ''}
			</h3>
			{affirmationsLoading ? (
				<>
					<div className="space-y-1">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-3/4" />
					</div>
					<Skeleton className="h-8 w-40" />
				</>
			) : affirmationElements?.length ? (
				<>
					{affirmationElements}
					<Link href="/affirmations">
						<Button className="bg-background text-foreground">
							<HeartIcon className="size-[18px]" />
							View more affirmations
						</Button>
					</Link>
				</>
			) : (
				<>
					<p>You have not received any affirmations yet.</p>
				</>
			)}
		</div>
	);
};

export default AffirmationWidget;
