'use client';

import type { SongRecommendation } from '@lumi/core/song-recommendations/song-recommendation.types';
import type { FC } from 'react';
import { ChatBubbleLeftIcon, ClockIcon, StarIcon } from '@heroicons/react/24/solid';
import moment from 'moment';
import { useMemo } from 'react';

import { useRelationship } from '@/components/providers/relationships/relationship-provder';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import Image from '@/components/ui/image';
import { Separator } from '@/components/ui/separator';
import UserAvatar from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';
import DeleteRecommendationButton from '../buttons/delete-recommendation-button';
import ListenRecommendationButton from '../buttons/listen-recommendation-button';

type Props = {
	track: SongRecommendation;
	type: 'receiver' | 'sender' | 'listened';
};

const RecommendedTrack: FC<Props> = ({ track: { track: trackDetails, ...track }, type }) => {
	const { self, partner } = useRelationship();

	const trackRating = useMemo(() => track.rating ?? -1, [track.rating]);
	const recommender = useMemo(
		() => (track.recommenderId === self.id ? self : partner),
		[partner, self, track.recommenderId],
	);
	const receiver = useMemo(() => (recommender.id === self.id ? partner : self), [partner, recommender.id, self]);
	return (
		<div className={cn('flex w-full justify-between gap-x-3 items-center hover:bg-white/20 p-2 rounded-md')}>
			<div
				className={cn(
					'grid gap-x-4 items-center',
					type === 'listened'
						? 'grid-cols-[2rem_2.5rem_minmax(0,_1fr)] tablet:grid-cols-[2rem_4rem_minmax(0,_1fr)]'
						: 'grid-cols-[2.5rem_minmax(0,_1fr)] tablet:grid-cols-[4rem_minmax(0,_1fr)]',
				)}
			>
				{type === 'listened' && (
					<div className="flex flex-col items-center">
						<UserAvatar
							user={recommender}
							hideStatus
							className="size-8 border-1 border-border aspect-square shrink-0"
						/>
						<p className="text-xs/3">{recommender.firstName}</p>
					</div>
				)}
				<Image
					src={trackDetails.albumImage}
					fallbackSrc="/fallback/music.png"
					alt={`${trackDetails.name} Album Art`}
					className="size-10 tablet:size-16 aspect-square rounded-sm shrink-0 border border-border"
					fill
					objectFit="cover"
				/>
				<div>
					<p className="font-semibold inline-flex items-center gap-2">
						<span className="line-clamp-1 inline">{trackDetails.name}</span>
						{' '}
						{type !== 'listened' && (
							<span className="text-xs text-foreground/60 inline-flex items-center gap-1">
								<ClockIcon className="size-3" />
								{moment(trackDetails.duration).format('mm:ss')}
							</span>
						)}
						{/* {track.explicit && <span className="text-xs p-1 bg-black/50 rounded-xs">EXPLICIT</span>} */}
					</p>
					<p className="text-xs text-foreground/50 line-clamp-1">{trackDetails.artistName}</p>
				</div>
			</div>
			<div className="flex flex-col gap-2 items-end">
				{type === 'sender'
					? (
							<>
								<DeleteRecommendationButton track={{ ...track, track: trackDetails }} />
							</>
						)
					: type === 'receiver'
						? (
								<>
									<ListenRecommendationButton track={{ ...track, track: trackDetails }} />
								</>
							)
						: (
								<>
									<p className="inline-flex items-center gap-2">
										<StarIcon className="size-3 text-amber-400" />
										<span>
											<span
												className={cn(
													trackRating === 10 && 'text-amber-400',
													trackRating < 10 && trackRating >= 7 && 'text-green-500',
													trackRating < 7 && trackRating >= 4 && 'text-yellow-200',
													trackRating < 4 && trackRating >= 0 && 'text-red-500',
												)}
											>
												{track.rating ?? '?'}
											</span>
											/10
										</span>
									</p>
									<Dialog>
										<DialogTrigger asChild>
											<button className="flex gap-1 items-center text-xs text-neutral-500 cursor-pointer">
												<ChatBubbleLeftIcon className="size-3" />
												Details
											</button>
										</DialogTrigger>
										<DialogContent>
											<DialogHeader>
												<DialogTitle>
													{trackDetails.name}
													{' '}
													by
													{trackDetails.artistName}
												</DialogTitle>
												<DialogDescription className="flex flex-col text-xs">
													<span>
														Recommended on
														{' '}
														{new Date(track.createdAt).toLocaleDateString('en-US', {
															dateStyle: 'medium',
														})}
														{' '}
														at
														{' '}
														{new Date(track.createdAt).toLocaleTimeString('en-US', {
															timeStyle: 'short',
														})}
													</span>
													<span>
														Rated on
														{' '}
														{track.updatedAt
															? `${new Date(track.updatedAt).toLocaleDateString('en-US', {
																dateStyle: 'medium',
															})
															} at ${
																new Date(track.updatedAt).toLocaleTimeString('en-US', {
																	timeStyle: 'short',
																})}`
															: 'unknown'}
													</span>
												</DialogDescription>
											</DialogHeader>
											<h3 className="text-2xl text-primary font-bold mt-6">
												Comments from
												{' '}
												{receiver.firstName}
											</h3>
											<Separator className="my-4" />
											<p className="whitespace-pre-wrap break-words">{track.comments}</p>
										</DialogContent>
									</Dialog>
								</>
							)}
			</div>
		</div>
	);
};

export default RecommendedTrack;
