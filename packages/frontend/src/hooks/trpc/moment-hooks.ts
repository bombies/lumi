'use client';

import { toast } from 'sonner';

import { useRouteInvalidation } from '@/lib/hooks/useRouteInvalidation';
import { trpc } from '@/lib/trpc/client';
import { useSingleMediaUploader } from './utils/media-utils';

export const CreateMomentDetails = () =>
	trpc.moments.createMomentDetails.useMutation({
		onSuccess() {
			toast.success('Successfully uploaded your moment!');
		},
	});
export const GetMomentDetails = (momentId: string) => trpc.moments.getMomentDetails.useQuery(momentId);
export const GetMoments = (userId?: string) =>
	trpc.moments.getMoments.useInfiniteQuery(
		{ userId },
		{
			getNextPageParam: lastPage => lastPage.cursor,
		},
	);

export const UpdateMomentDetails = () => {
	const invalidateRoutes = useRouteInvalidation([trpc.moments.getMomentDetails]);
	return trpc.moments.updateMomentDetails.useMutation({
		onSuccess: () => invalidateRoutes(),
	});
};

export const DeleteMomentDetails = () => {
	const invalidateRoutes = useRouteInvalidation([trpc.moments.getMomentDetails]);
	return trpc.moments.deleteMomentDetails.useMutation({
		onSuccess: () => invalidateRoutes(),
	});
};

export const GetMessagesForMoment = (momentId: string) =>
	trpc.moments.getMessagesForMoment.useInfiniteQuery(
		{
			momentId,
		},
		{
			staleTime: Infinity,
			getNextPageParam: lastPage => lastPage.cursor,
		},
	);

export const CreateMomentMessage = () => {
	const invalidateRoutes = useRouteInvalidation([trpc.moments.getMessagesForMoment]);
	return trpc.moments.createMomentMessage.useMutation({
		onSuccess: () => invalidateRoutes(),
	});
};

export const DeleteMomentMessage = () => {
	const invalidateRoutes = useRouteInvalidation([trpc.moments.getMessagesForMoment]);
	return trpc.moments.deleteMomentMessage.useMutation({
		onSuccess: () => invalidateRoutes(),
	});
};

export const GetMomentUploadUrl = () => trpc.moments.getMomentUploadUrl.useMutation();

export const UploadMoment = () => {
	const { mutateAsync: fetchUrl } = GetMomentUploadUrl();
	return useSingleMediaUploader(fetchUrl);
};
