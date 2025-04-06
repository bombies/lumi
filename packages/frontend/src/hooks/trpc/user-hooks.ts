'use client';

import { skipToken } from '@tanstack/react-query';

import { useRouteInvalidation } from '@/lib/hooks/useRouteInvalidation';
import { trpc } from '@/lib/trpc/client';
import { useSingleMediaUploader } from './utils/media-utils';

export const UpdateUser = () => {
	const invalidateRoutes = useRouteInvalidation([trpc.users.getSelf]);
	return trpc.users.updateSelf.useMutation({
		onSuccess() {
			invalidateRoutes();
		},
	});
};
export const GetSelfUser = () => trpc.users.getSelf.useQuery();
export const GetSelfUserOnDemand = () => trpc.users.getSelfOnDemand.useMutation();
export const GetUserAvatarUploadUrl = () => trpc.users.getUserAvatarUploadUrl.useMutation();

export const FetchUsersByUsername = ({ searchQuery }: { searchQuery: string }) =>
	trpc.users.getUsersByUsername.useInfiniteQuery(
		searchQuery.length > 0 ? { username: searchQuery, projections: ['id', 'username'] } : skipToken,
		{
			getNextPageParam: lastPage => lastPage.nextCursor,
		},
	);

export const UploadUserAvatar = () => {
	const { mutateAsync: fetchAvatarUploadUrl } = GetUserAvatarUploadUrl();
	return useSingleMediaUploader(fetchAvatarUploadUrl);
};

export const GetUserByIdSafe = (userId: string) => trpc.users.getUserByIdSafe.useQuery(userId);

export const DeleteSelf = () => trpc.users.deleteSelf.useMutation();
