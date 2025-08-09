'use client';

import type { CreateMomentDetailsDto, CreateMomentMessageDto, CreateMomentTagDto, ReactToMessageDto, UpdateMomentDetailsDto, UpdateMomentMessageDto } from '@/lib/api/modules/moment/moment.dto';
import type { GetUploadUrlDto, InfiniteDataArgs, InfiniteDataWithOrderArgs } from '@/lib/api/types/dto.types';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/api';
import { useSingleMediaUploader } from './utils/media-utils';

export const CreateMomentDetails = () =>
	useMutation({
		mutationFn: (data: CreateMomentDetailsDto) => apiClient.moments.createMomentDetails(data),
		onSuccess() {
			toast.success('Successfully uploaded your moment!');
		},
	});

const GetMomentDetailsQueryKey = (momentId: string) => ['moment', 'details', momentId];

export const GetMomentDetails = (momentId: string) =>
	useQuery({
		queryKey: GetMomentDetailsQueryKey(momentId),
		queryFn: () => apiClient.moments.getMomentDetails(momentId),
	});

const SearchMomentsQueryKey = (query: string) => ['moments', 'search', query];

export const SearchMoments = (
	query: string,
	args?: InfiniteDataWithOrderArgs,
) =>
	useInfiniteQuery({
		queryKey: SearchMomentsQueryKey(query),
		initialPageParam: null as [Record<string, any> | null, Record<string, any> | null] | null,
		queryFn: ({ pageParam }) => {
			return apiClient.moments.searchMoments({ query, ...args, cursor: pageParam });
		},
		getNextPageParam: (lastPage) => {
			const [titleCursor, tagCursor] = lastPage.nextCursor;
			if (!titleCursor && !tagCursor) return undefined;
			else return lastPage.nextCursor;
		},
		enabled: query.length > 0,
	});

const GetMomentsQueryKey = ['moments'];

export const GetMoments = (
	userId?: string,
	args?: InfiniteDataWithOrderArgs & { search?: string },
) =>
	args?.search
		? SearchMoments(args.search, { limit: args.limit, order: args.order })
		// eslint-disable-next-line react-hooks/rules-of-hooks
		: useInfiniteQuery({
				queryKey: GetMomentsQueryKey,
				initialPageParam: null as Record<string, any> | null,
				queryFn: ({ pageParam }) => {
					return apiClient.moments.getMoments({
						limit: args?.limit,
						order: args?.order,
						user: userId,
						cursor: pageParam,
					});
				},
				getNextPageParam: lastPage => lastPage.nextCursor,

			});

export const UpdateMomentDetails = (momentId: string) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: UpdateMomentDetailsDto) => apiClient.moments.updateMomentDetails(momentId, dto),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: GetMomentDetailsQueryKey(momentId) }),
	});
};

export const DeleteMomentDetails = (momentId: string) => {
	return useMutation({
		mutationFn: () => apiClient.moments.deleteMomentDetails(momentId),
	});
};

const GetMessagesForMomentQueryKey = (momentId: string) => ['moments', 'messages', momentId];

export const GetMessagesForMoment = ({ momentId, ...args }: InfiniteDataWithOrderArgs & { momentId: string }) =>
	useInfiniteQuery({
		queryKey: GetMessagesForMomentQueryKey(momentId),
		initialPageParam: null as Record<string, any> | null,
		queryFn: ({ pageParam }) =>
			apiClient.moments.getMessagesForMoment(momentId, { cursor: pageParam, ...args }),
		getNextPageParam: lastPage => lastPage.nextCursor,

	});

export const CreateMomentMessage = (momentId: string) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: CreateMomentMessageDto) => apiClient.moments.createMomentMessage(momentId, dto),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: GetMessagesForMomentQueryKey(momentId) }),
	});
};

export const SetMomentMessageReaction = (momentId: string, messageId: string) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: ReactToMessageDto) => apiClient.moments.reactToMessage(momentId, messageId, dto),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: GetMessagesForMomentQueryKey(momentId) }),
	});
};

export const EditMomentMessage = (momentId: string, messageId: string) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: UpdateMomentMessageDto) => apiClient.moments.editMomentMessage(momentId, messageId, dto),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: GetMessagesForMomentQueryKey(momentId) }),
	});
};

export const DeleteMomentMessage = (momentId: string, messageId: string) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => apiClient.moments.deleteMomentMessage(momentId, messageId),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: GetMessagesForMomentQueryKey(momentId) }),
	});
};

export const GetMomentUploadUrl = () =>
	useMutation({
		mutationFn: (params: GetUploadUrlDto) => apiClient.moments.getMomentUploadUrl(params),
	});

const GetRelationshipMomentTagsQueryKey = ['moments', 'relationshiptags'];

export const GetRelationshipMomentTags = ({
	query,
	...args
}: InfiniteDataArgs & { query: string }) =>
	useInfiniteQuery({
		queryKey: GetRelationshipMomentTagsQueryKey,
		initialPageParam: null as Record<string, any> | null,
		queryFn: ({ pageParam }) =>
			apiClient.moments.getRelationshipMomentMomentTags({ query, ...args, cursor: pageParam }),
		getNextPageParam: lastPage => lastPage.nextCursor,

	});

const GetMomentsForRelationshipTagQueryKey = (tag: string) => ['moments', 'relationshiptag', tag];

export const GetMomentsForRelationshipTag = (
	{
		tag,
		...args
	}: InfiniteDataWithOrderArgs & { tag: string },
) =>
	useInfiniteQuery({
		queryKey: GetMomentsForRelationshipTagQueryKey(tag),
		initialPageParam: null as Record<string, any> | null,
		queryFn: ({ pageParam }) =>
			apiClient.moments.getMoments({ tag, ...args, cursor: pageParam }),
		enabled: tag.length > 0,
		getNextPageParam: lastPage => lastPage.nextCursor,

	});

export const CreateRelationshipMomentTag = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: CreateMomentTagDto) => apiClient.moments.createRelationshipMomentTag(dto),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: GetRelationshipMomentTagsQueryKey }),
	});
};

export const DeleteRelationshipMomentTag = (tag: string) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => apiClient.moments.deleteRelationshipMomentTag(tag),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: GetRelationshipMomentTagsQueryKey }),
	});
};

const GetMomentTagsQueryKey = ['moment', 'tags'];

export const GetMomentTags = (momentId: string) =>
	useQuery({
		queryKey: GetMomentTagsQueryKey,
		queryFn: () => apiClient.moments.getTagsForMoment(momentId),
	});

export const CreateMomentTag = (momentId: string) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: CreateMomentTagDto) => apiClient.moments.createTagForMoment(momentId, dto),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: GetMomentTagsQueryKey }),
	});
};

export const DeleteMomentTag = (momentId: string) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => apiClient.moments.getTagsForMoment(momentId),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: GetMomentTagsQueryKey }),
	});
};

export const UploadMoment = () => {
	const { mutateAsync: fetchUrl } = GetMomentUploadUrl();
	return useSingleMediaUploader(fetchUrl);
};
