'use client';

import type { UpdateUserDto } from '@/lib/api/modules/user/user.dto';

import type { GetUploadUrlDto } from '@/lib/api/types/dto.types';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/api';
import { useSingleMediaUploader } from './utils/media-utils';

export const UpdateUser = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: UpdateUserDto) => apiClient.users.updateSelf(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users', 'self'] });
		},
	});
};
export const GetSelfUser = () => useQuery({
	queryKey: ['users', 'self'],
	queryFn: () => apiClient.users.getSelf(),
});

export const GetSelfUserOnDemand = () => useMutation({
	mutationFn: () => apiClient.users.getSelf(),
});

export const GetUserAvatarUploadUrl = () => useMutation({
	mutationFn: (params: GetUploadUrlDto) => apiClient.users.getUserAvatarUploadUser(params),
});

export const FetchUsersByUsername = ({ searchQuery }: { searchQuery: string }) =>
	useInfiniteQuery({
		queryKey: ['users', 'username', searchQuery],
		initialPageParam: null as Record<string, any> | null,
		queryFn: ({ pageParam }) =>
			apiClient.users.getUsersByUsername({
				username: searchQuery,
				limit: 10,
				cursor: pageParam,
				projections: ['id', 'username'],
			}),
		getNextPageParam: lastPage => lastPage.nextCursor,
		enabled: searchQuery.length > 0,
	});

export const UploadUserAvatar = () => {
	const { mutateAsync: fetchAvatarUploadUrl } = GetUserAvatarUploadUrl();
	return useSingleMediaUploader(fetchAvatarUploadUrl);
};

export const GetUserByIdSafe = (userId: string) => useQuery({
	queryKey: ['users', 'id'],
	queryFn: () => apiClient.users.getUserById(userId),
});

export const DeleteSelf = () => useMutation({
	mutationFn: () => apiClient.users.deleteSelf(),
});
