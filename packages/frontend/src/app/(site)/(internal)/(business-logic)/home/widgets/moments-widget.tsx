'use client';

import { FC, useMemo } from 'react';
import Link from 'next/link';
import { VideoCameraIcon } from '@heroicons/react/24/solid';

import { Button } from '@/components/ui/button';
import { GetMoments } from '@/hooks/trpc/moment-hooks';
import { cn } from '@/lib/utils';
import MomentCard from '../../moments/components/moment-card';
import MomentCardSkeleton from '../../moments/components/moment-card-skeleton';

const MomentsWidget: FC = () => {
	const {
		data: momentPages,
		isLoading: momentsLoading,
		hasNextPage: hasMoreMoments,
	} = GetMoments(undefined, {
		limit: 4,
	});

	const moments = useMemo(
		() =>
			momentPages?.pages.flatMap(page =>
				page.data.map((moment, idx, data) => (
					<MomentCard
						key={moment.id}
						moment={moment}
						linkClassName={cn((idx + 1) % 2 !== 0 && !data[idx + 1] && 'col-span-2')}
						className={cn('h-80')}
						compactUploaderDisplay
					/>
				)),
			),
		[momentPages?.pages],
	);

	return (
		<div className="max-w-[45rem] space-y-4">
			<h3 className="font-bold text-2xl">The Latest &ldquo;Moments&rdquo;</h3>
			<div className="grid grid-cols-2 gap-2">
				{momentsLoading ? (
					<>
						<MomentCardSkeleton />
						<MomentCardSkeleton />
						<MomentCardSkeleton />
						<MomentCardSkeleton />
					</>
				) : moments?.length ? (
					moments
				) : (
					<p className="col-span-2 p-6 rounded-md border border-border border-dashed font-mono">
						There are no moments... You can{' '}
						<Link href="/moments/upload">
							<span className="underline text-accent">upload</span>
						</Link>{' '}
						one whenever!
					</p>
				)}
			</div>
			{hasMoreMoments ? (
				<Link href="/moments">
					<Button className="w-full">
						<VideoCameraIcon className="size-[18px]" /> View All Moments
					</Button>
				</Link>
			) : undefined}
		</div>
	);
};

export default MomentsWidget;
