'use client';

import type { SongRecommendation } from '@lumi/core/song-recommendations/song-recommendation.types';
import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { DeleteSongRecommendation } from '@/hooks/trpc/music-sharing-hooks';

import { getErrorMessage } from '@/lib/trpc/utils';
import TrashIcon from '@heroicons/react/24/solid/TrashIcon';
import { toast } from 'sonner';

type Props = {
	track: SongRecommendation;
};

const DeleteRecommendationButton: FC<Props> = ({ track }) => {
	const { mutateAsync: deleteRec, isPending: isDeleting } = DeleteSongRecommendation();
	return (
		<Button
			size="icon"
			variant="destructive"
			tooltip="Delete Recommendation"
			loading={isDeleting}
			onClick={() => {
				toast.promise(deleteRec(track.id), {
					loading: 'Deleting recommendation...',
					success: 'Recommendation deleted!',
					error(e) {
						return getErrorMessage(e);
					},
				});
			}}
		>
			<TrashIcon className="size-[18px]" />
		</Button>
	);
};

export default DeleteRecommendationButton;
