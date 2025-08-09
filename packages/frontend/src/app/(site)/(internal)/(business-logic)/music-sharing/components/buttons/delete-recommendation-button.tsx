'use client';

import type { FC } from 'react';
import type { SongRecommendation } from '@/lib/api/modules/music/music.model';
import TrashIcon from '@heroicons/react/24/solid/TrashIcon';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DeleteSongRecommendation } from '@/hooks/trpc/music-sharing-hooks';
import { getErrorMessage } from '@/lib/trpc/utils';

type Props = {
	track: SongRecommendation;
};

const DeleteRecommendationButton: FC<Props> = ({ track }) => {
	const { mutateAsync: deleteRec, isPending: isDeleting } = DeleteSongRecommendation(track.id);
	return (
		<Button
			size="icon"
			variant="destructive"
			tooltip="Delete Recommendation"
			loading={isDeleting}
			onClick={() => {
				toast.promise(deleteRec(), {
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
