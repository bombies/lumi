'use client';

import { useRouteInvalidation } from '@/lib/hooks/useRouteInvalidation';
import { trpc } from '@/lib/trpc/client';

export const CreateSongRecommendation = () => {
	const invalidateRoutes = useRouteInvalidation([trpc.musicSharing.createSongRecommendation]);
	return trpc.musicSharing.createSongRecommendation.useMutation({
		onSuccess() {
			invalidateRoutes();
		},
	});
};
export const GetSongRecommendations = ({
	order,
	filter,
	limit,
	self,
}: {
	order: 'asc' | 'desc';
	filter?: 'listened' | 'unlistened';
	limit?: number;
	self?: boolean;
}) =>
	(!self ? trpc.musicSharing.getSongRecommendations : trpc.musicSharing.getSelfSongRecommendations).useInfiniteQuery(
		{ order, filter, limit },
		{
			getNextPageParam: lastPage => lastPage.cursor,
		},
	);
export const UpdateSongRecommendation = () => trpc.musicSharing.updateSongRecommendation.useMutation();
export const DeleteSongRecommendation = () => trpc.musicSharing.deleteSongRecommendation.useMutation();
