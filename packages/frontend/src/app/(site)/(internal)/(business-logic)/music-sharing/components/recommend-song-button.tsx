'use client';

import { FC, useState } from 'react';
import { MusicalNoteIcon } from '@heroicons/react/24/solid';
import { SearchIcon } from 'lucide-react';
import { toast } from 'sonner';

import { useRelationship } from '@/components/providers/relationships/relationship-provder';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { CreateSongRecommendation } from '@/hooks/trpc/music-sharing-hooks';
import useSpotifyQuery from '@/lib/hooks/spotify/useSpotifyQuery';
import { getErrorMessage } from '@/lib/trpc/utils';
import TrackSearchResult from './tracks/track-search-result';
import TrackSearchResultSkeleton from './tracks/track-search-result-skeleton';

const RecommendSongButton: FC = () => {
	const { sendNotificationToPartner } = useRelationship();
	const { mutateAsync: recommendSong, isPending: isRecommending } = CreateSongRecommendation();
	const [query, setQuery] = useState<string>();
	const { data: trackData, isLoading: tracksLoading } = useSpotifyQuery(
		`search-tracks${query ? `-${query}` : ''}`,
		query ? async api => api.search(query, ['track'], undefined, 10) : undefined,
	);
	const [dialogOpen, setDialogOpen] = useState(false);

	const trackElements = trackData?.tracks.items.map(track => (
		<TrackSearchResult
			key={`track_result#${track.id}`}
			track={track}
			onClick={() => {
				setDialogOpen(false);
				setQuery(undefined);
				toast.promise(
					recommendSong({
						id: track.id,
						name: track.name,
						uri: track.uri,
						artistName: track.artists[0].name,
						duration: track.duration_ms,
						albumImage: track.album.images[0].url,
					}),
					{
						loading: `Recommending ${track.name} by ${track.artists[0].name}`,
						async success() {
							await sendNotificationToPartner({
								title: 'New Song Recommendation',
								content: `You have received a new song recommendation: ${track.name} by ${track.artists[0].name}`,
							});
							return `You have recommended ${track.name} by ${track.artists[0].name}`;
						},
						error(e) {
							return getErrorMessage(e, {
								defaultMessage: 'Could not recommend that track!',
							});
						},
					},
				);
			}}
		/>
	));

	return (
		<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
			<DialogTrigger asChild>
				<Button disabled={isRecommending} variant="accent">
					<MusicalNoteIcon className="size-[18px] mr-2" /> Recommend Song
				</Button>
			</DialogTrigger>
			<DialogContent
				className="p-2 gap-2 max-h-screen overflow-y-auto bg-background/50 backdrop-blur-lg"
				hideCloseButton
			>
				<DialogTitle hidden>Song Search</DialogTitle>
				<Input
					startContent={<SearchIcon size={24} className="text-foreground/20" />}
					placeholder="Search for a track..."
					className="rounded-none bg-transparent border-transparent ring-0"
					typingEndDelay={300}
					onTypingEnd={val => setQuery(val)}
				/>
				{tracksLoading ? (
					<>
						<Separator className="my-1" />
						<TrackSearchResultSkeleton />
						<TrackSearchResultSkeleton />
						<TrackSearchResultSkeleton />
						<TrackSearchResultSkeleton />
						<TrackSearchResultSkeleton />
					</>
				) : query?.length && trackElements?.length ? (
					<>
						<Separator className="my-1" />
						{trackElements}
					</>
				) : undefined}
			</DialogContent>
		</Dialog>
	);
};

export default RecommendSongButton;
