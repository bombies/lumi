'use client';

import { skipToken } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useRouteInvalidation } from '@/lib/hooks/useRouteInvalidation';
import { trpc } from '@/lib/trpc/trpc-react';
import { useSingleMediaUploader } from './utils/media-utils';

export const CreateMomentDetails = () =>
	trpc.moments.createMomentDetails.useMutation({
		onSuccess() {
			toast.success('Successfully uploaded your moment!');
		},
	});
export const GetMomentDetails = (momentId: string) => trpc.moments.getMomentDetails.useQuery(momentId);

export const SearchMoments = (
	query: string,
	args?: {
		limit?: number;
		order?: 'asc' | 'desc';
	},
) =>
	trpc.moments.searchMoments.useInfiniteQuery(
		{
			query,
			...args,
		},
		{
			getNextPageParam: (lastPage) => {
				const [titleCursor, tagCursor] = lastPage.nextCursor;
				if (!titleCursor && !tagCursor) return undefined;
				else return lastPage.nextCursor;
			},
		},
	);

export const GetMoments = (userId?: string, args?: { limit?: number; order?: 'asc' | 'desc'; search?: string }) =>
	args?.search
		? SearchMoments(args.search, { limit: args.limit, order: args.order })
		: trpc.moments.getMoments.useInfiniteQuery(
				{ userId, limit: args?.limit },
				{
					getNextPageParam: lastPage => lastPage.nextCursor,
				},
			);

export const UpdateMomentDetails = () => {
	const invalidateRoutes = useRouteInvalidation([trpc.moments.getMomentDetails]);
	return trpc.moments.updateMomentDetails.useMutation({
		onSuccess: () => invalidateRoutes(),
	});
};

export const DeleteMomentDetails = () => {
	return trpc.moments.deleteMomentDetails.useMutation();
};

export const GetMessagesForMoment = (momentId: string) =>
	trpc.moments.getMessagesForMoment.useInfiniteQuery(
		{
			momentId,
		},
		{
			staleTime: Infinity,
			getNextPageParam: lastPage => lastPage.nextCursor,
		},
	);

export const CreateMomentMessage = () => {
	const invalidateRoutes = useRouteInvalidation([trpc.moments.getMessagesForMoment]);
	return trpc.moments.createMomentMessage.useMutation({
		onSuccess: () => invalidateRoutes(),
	});
};

export const SetMomentMessageReaction = () => {
	const invalidateRoutes = useRouteInvalidation([trpc.moments.getMessagesForMoment]);
	return trpc.moments.reactToMessage.useMutation({
		onSuccess: () => invalidateRoutes(),
	});
};

export const EditMomentMessage = () => {
	const invalidateRoutes = useRouteInvalidation([trpc.moments.getMessagesForMoment]);
	return trpc.moments.editMessage.useMutation({
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

export const GetRelationshipMomentTags = (query?: string, limit?: number) =>
	trpc.moments.getRelationshipMomentTags.useInfiniteQuery(
		{ query, limit },
		{
			getNextPageParam: lastPage => lastPage.nextCursor,
		},
	);

export const GetMomentsForRelationshipTag = (
	tag?: string,
	args?: {
		limit?: number;
		order?: 'asc' | 'desc';
	},
) =>
	trpc.moments.getMomentsByTag.useInfiniteQuery(
		tag ? { tagQuery: tag, limit: args?.limit, order: args?.order } : skipToken,
		{
			getNextPageParam: lastPage => lastPage.cursor,
		},
	);

export const CreateRelationshipMomentTag = () => {
	const invalidateRoutes = useRouteInvalidation([trpc.moments.getRelationshipMomentTags]);
	return trpc.moments.createRelationshipMomentTag.useMutation({
		onSuccess: () => invalidateRoutes(),
	});
};

export const DeleteRelationshipMomentTag = () => {
	const invalidateRoutes = useRouteInvalidation([trpc.moments.getRelationshipMomentTags]);
	return trpc.moments.deleteRelationshipMomentTag.useMutation({
		onSuccess: () => invalidateRoutes(),
	});
};

export const GetMomentTags = (momentId: string) => trpc.moments.getTagsForMoment.useQuery(momentId);

export const CreateMomentTag = () => {
	const invalidateRoutes = useRouteInvalidation([trpc.moments.getTagsForMoment]);
	return trpc.moments.createTagForMoment.useMutation({
		onSuccess: () => invalidateRoutes(),
	});
};

export const DeleteMomentTag = () => {
	const invalidateRoutes = useRouteInvalidation([trpc.moments.getTagsForMoment]);
	return trpc.moments.deleteTagForMoment.useMutation({
		onSuccess: () => invalidateRoutes(),
	});
};

export const UploadMoment = () => {
	const { mutateAsync: fetchUrl } = GetMomentUploadUrl();
	return useSingleMediaUploader(fetchUrl);
};
