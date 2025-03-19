'use client';

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

export const UploadUserAvatar = () => {
	const { mutateAsync: fetchAvatarUploadUrl } = GetUserAvatarUploadUrl();
	return useSingleMediaUploader(fetchAvatarUploadUrl);
};
