'use client';

import type { FC } from 'react';
import { MusicalNoteIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { Fragment, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { GetSongRecommendations } from '@/hooks/trpc/music-sharing-hooks';
import { cn } from '@/lib/utils';
import RecommendedTrack from '../../music-sharing/components/tracks/recommended-track';
import TrackSearchResultSkeleton from '../../music-sharing/components/tracks/track-search-result-skeleton';

const MusicWidget: FC = () => {
	const { data: songRecs, isLoading: songRecsLoading } = GetSongRecommendations({
		order: 'desc',
		filter: 'unlistened',
		limit: 5,
	});

	const recommendationElements = useMemo(
		() =>
			songRecs?.pages.flatMap(page =>
				page.data.map(songRec => (
					<Fragment key={`rec_track_${songRec.id}`}>
						<RecommendedTrack track={songRec} type="receiver" />
						<Separator />
					</Fragment>
				)),
			),
		[songRecs?.pages],
	);

	return (
		<div
			className={cn('max-w-[45rem] rounded-md border border-border p-6 space-y-4 bg-cover bg-no-repeat')}
			style={{
				backgroundImage:
					songRecs?.pages[0].data[0]?.track.albumImage
					&& `url('${songRecs.pages[0].data[0].track.albumImage}')`,
			}}
		>
			<div className="bg-background/50 backdrop-blur-lg p-6 rounded-sm border border-border w-fit">
				<h3 className="text-2xl font-bold flex gap-2 items-center">
					<MusicalNoteIcon className="size-[24px]" />
					{' '}
					Your Music
				</h3>
			</div>
			<div className="bg-background/50 backdrop-blur-lg space-y-6 p-6 rounded-sm border border-border">
				<h4 className="font-bold text-xl">Latest Song Recommendations</h4>
				<div className="flex flex-col gap-4">
					{songRecsLoading
						? (
								<>
									<TrackSearchResultSkeleton />
									<Separator />
									<TrackSearchResultSkeleton />
									<Separator />
									<TrackSearchResultSkeleton />
									<Separator />
									<TrackSearchResultSkeleton />
									<Separator />
									<TrackSearchResultSkeleton />
									<Separator />
								</>
							)
						: songRecs?.pages[0].data.length
							? (
									recommendationElements
								)
							: (
									<p>You have not received any new song recommendations...</p>
								)}
				</div>
				<Link href="/music-sharing">
					<Button>
						<MusicalNoteIcon className="size-[18px]" />
						{' '}
						View All Recommendations
					</Button>
				</Link>
			</div>
		</div>
	);
};

export default MusicWidget;
