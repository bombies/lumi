'use client';

import type { CreateSongRecommendationDto, UpdateSongRecommendationDto } from '@/lib/api/modules/music/music.dto';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/api';
import { handleTrpcError } from '@/lib/trpc/utils';

const GetSongRecommendationsQueryKey = (fetchType: 'self' | 'partner' | 'relationship' = 'partner') => ['song-recs', fetchType];

export const GetSongRecommendations = ({
	order,
	filter,
	limit,
	fetchType,
}: {
	order: 'asc' | 'desc';
	filter?: 'listened' | 'unlistened';
	limit?: number;
	fetchType?: 'self' | 'partner' | 'relationship';
}) =>
	useInfiniteQuery({
		queryKey: GetSongRecommendationsQueryKey(fetchType),
		initialPageParam: null as Record<string, any> | null,
		queryFn: ({ pageParam }) => {
			return (!fetchType || fetchType === 'partner'
				? apiClient.music.getSongRecommendations
				: fetchType === 'self'
					? apiClient.music.getSelfSongRecommendations
					: apiClient.music.getRelationshipSongRecommendations
			)({ order, filter, limit, cursor: pageParam });
		},
		getNextPageParam: lastPage => lastPage.nextCursor,

	});

export const CreateSongRecommendation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: CreateSongRecommendationDto) => apiClient.music.createSongRecommendation(dto),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: GetSongRecommendationsQueryKey('partner') });
			queryClient.invalidateQueries({ queryKey: GetSongRecommendationsQueryKey('self') });
			queryClient.invalidateQueries({ queryKey: GetSongRecommendationsQueryKey('relationship') });
		},
	});
};

export const UpdateSongRecommendation = (songRecId: string) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: UpdateSongRecommendationDto) => apiClient.music.updateSongRecommendation(songRecId, dto),
		onSuccess: () => {
			toast.success('You have rated that recommendation!');
			queryClient.invalidateQueries({ queryKey: GetSongRecommendationsQueryKey('partner') });
			queryClient.invalidateQueries({ queryKey: GetSongRecommendationsQueryKey('self') });
			queryClient.invalidateQueries({ queryKey: GetSongRecommendationsQueryKey('relationship') });
		},
		onError(e) {
			handleTrpcError(e);
		},
	});
};

export const DeleteSongRecommendation = (songRecId: string) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => apiClient.music.deleteSongRecommendation(songRecId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: GetSongRecommendationsQueryKey('partner') });
			queryClient.invalidateQueries({ queryKey: GetSongRecommendationsQueryKey('self') });
			queryClient.invalidateQueries({ queryKey: GetSongRecommendationsQueryKey('relationship') });
		},
	});
};
