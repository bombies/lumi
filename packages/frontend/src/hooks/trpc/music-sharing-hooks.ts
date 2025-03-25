'use client';

import { toast } from 'sonner';

import { useRouteInvalidation } from '@/lib/hooks/useRouteInvalidation';
import { trpc } from '@/lib/trpc/client';
import { handleTrpcError } from '@/lib/trpc/utils';

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

export const UpdateSongRecommendation = () => {
	const invalidateRoutes = useRouteInvalidation([trpc.musicSharing.createSongRecommendation]);
	return trpc.musicSharing.updateSongRecommendation.useMutation({
		onSuccess() {
			toast.success('You have rated that recommendation!');
			invalidateRoutes();
		},
		onError(e) {
			handleTrpcError(e);
		},
	});
};

export const DeleteSongRecommendation = () => {
	const invalidateRoutes = useRouteInvalidation([trpc.musicSharing.createSongRecommendation]);
	return trpc.musicSharing.deleteSongRecommendation.useMutation({
		onSuccess() {
			invalidateRoutes();
		},
	});
};
