'use client';

import { FC } from 'react';
import { ClockIcon } from '@heroicons/react/24/solid';
import { SongRecommendation } from '@lumi/core/types/song-recommendation.types';
import moment from 'moment';

import Image from '@/components/ui/image';
import DeleteRecommendationButton from '../buttons/delete-recommendation-button';
import ListenRecommendationButton from '../buttons/listen-recommendation-button';

type Props = {
	track: SongRecommendation;
	type: 'receiver' | 'sender' | 'listened';
};

const RecommendedTrack: FC<Props> = ({ track: { track: trackDetails, ...track }, type }) => {
	return (
		<div className="flex w-full justify-between gap-x-3 items-center hover:bg-white/20 p-2 rounded-md">
			<div className="flex gap-x-3 items-center">
				<Image
					src={trackDetails.albumImage}
					alt={`${trackDetails.name} Album Art`}
					className="size-10 aspect-square rounded-sm shrink-0"
					fill
					objectFit="cover"
				/>
				<div>
					<p className="font-semibold inline-flex items-center gap-2">
						<span className="line-clamp-1 inline">{trackDetails.name}</span>{' '}
						<span className="text-xs text-foreground/60 inline-flex items-center gap-1">
							<ClockIcon className="size-3" />
							{moment(trackDetails.duration).format('mm:ss')}
						</span>
						{/* {track.explicit && <span className="text-xs p-1 bg-black/50 rounded-xs">EXPLICIT</span>} */}
					</p>
					<p className="text-xs text-foreground/50 line-clamp-1">{trackDetails.artistName}</p>
				</div>
			</div>
			<div className="flex gap-2">
				{type === 'sender' ? (
					<>
						<DeleteRecommendationButton track={{ ...track, track: trackDetails }} />
					</>
				) : type === 'receiver' ? (
					<>
						<ListenRecommendationButton track={{ ...track, track: trackDetails }} />
					</>
				) : (
					<></>
				)}
			</div>
		</div>
	);
};

export default RecommendedTrack;
