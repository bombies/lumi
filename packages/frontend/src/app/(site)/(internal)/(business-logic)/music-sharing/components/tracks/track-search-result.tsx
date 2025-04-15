'use client';

import { FC, useMemo } from 'react';
import { Track } from '@spotify/web-api-ts-sdk';
import moment from 'moment';

import Image from '@/components/ui/image';

type Props = {
	track: Track;
	onClick?: () => void;
};

const TrackSearchResult: FC<Props> = ({ track, onClick }) => {
	const trackDetails = useMemo(() => {
		const smallestAlbumImage = track.album.images.reduce((smallest, image) => {
			if (image.height < smallest.height) return image;
			return smallest;
		});

		return {
			artist: track.artists.map(artist => artist.name).join(', '),
			title: track.name,
			album: track.album.name,
			image: smallestAlbumImage.url,
			duration: track.duration_ms,
		};
	}, [track.album.images, track.album.name, track.artists, track.duration_ms, track.name]);
	return (
		<div
			onClick={onClick}
			className="flex w-full justify-between gap-x-3 items-center hover:bg-white/20 p-2 rounded-md cursor-pointer"
		>
			<div className="flex gap-x-3 items-center">
				<Image
					src={trackDetails.image}
					fallbackSrc="/fallback/music.png"
					alt={`${track.name} Album Art`}
					className="size-10 aspect-square rounded-sm shrink-0"
					fill
					objectFit="cover"
				/>
				<div>
					<p className="font-semibold inline-flex gap-1 items-center">
						<span className="line-clamp-1 inline">{trackDetails.title}</span>
						{track.explicit && (
							<span className="text-xs px-1 bg-white/30 dark:bg-black/50 rounded-xs tracking-wide">
								E
							</span>
						)}
					</p>
					<p className="text-xs text-foreground/50 line-clamp-1">{trackDetails.artist}</p>
				</div>
			</div>
			<p className="text-xs">{moment(track.duration_ms).format('mm:ss')}</p>
		</div>
	);
};

export default TrackSearchResult;
