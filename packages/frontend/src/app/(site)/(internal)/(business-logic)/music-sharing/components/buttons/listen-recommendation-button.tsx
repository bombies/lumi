'use client';

import type { SongRecommendation } from '@lumi/core/song-recommendations/song-recommendation.types';
import type { FC } from 'react';
import { PlayIcon } from '@heroicons/react/24/solid';
import { SiSpotify } from '@icons-pack/react-simple-icons';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Image from '@/components/ui/image';
import RateRecommendationButton from './rate-recommendation-button';

type Props = {
	track: SongRecommendation;
};

const ListenRecommendationButton: FC<Props> = ({ track }) => {
	const [dialogOpen, setDialogOpen] = useState(false);
	return (
		<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
			<DialogTrigger asChild>
				<Button size="icon" variant="accent" tooltip="Listen to Recommendation">
					<PlayIcon className="size-[18px]" />
				</Button>
			</DialogTrigger>
			<DialogContent className="p-2 flex tablet:!max-w-fit bg-background/20 backdrop-blur-lg" hideCloseButton>
				<DialogTitle hidden>
					Listen to
					{' '}
					{track.track.name}
					{' '}
					by
					{' '}
					{track.track.artistName}
				</DialogTitle>
				<div className="flex flex-col w-full tablet:flex-row gap-4 tablet:gap-8">
					<Image
						src={track.track.albumImage}
						alt={`${track.track.name} by ${track.track.artistName} album art`}
						className="size-64 aspect-square rounded-sm shrink-0 self-center"
						fill
						objectFit="cover"
					/>
					<div className="space-y-2 h-full px-4">
						<h3 className="text-3xl font-bold">{track.track.name}</h3>
						<p>{track.track.artistName}</p>
						<Link
							href={`https://open.spotify.com/track/${track.track.id}`}
							target="_blank"
							className="block"
						>
							<Button variant="accent">
								<SiSpotify size={18} />
								{' '}
								Listen on Spotify
							</Button>
						</Link>
						<RateRecommendationButton track={track} onRate={() => setDialogOpen(false)} />
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default ListenRecommendationButton;
