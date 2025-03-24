'use client';

import { trpc } from '@/lib/trpc/client';

export const CreateSongRecommendation = () => trpc.musicSharing.createSongRecommendation.useMutation();
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
