'use client';

import type { DefaultError, UseMutateAsyncFunction } from '@tanstack/react-query';
import type { PresignedURLResponse } from '@/lib/api/types/api.types';
import type { GetUploadUrlDto } from '@/lib/api/types/dto.types';
import axios from 'axios';
import { useCallback, useState } from 'react';

export const useSingleMediaUploader = <
	TData extends PresignedURLResponse = any,
	TError = DefaultError,
	TVariables extends GetUploadUrlDto = any,
	TContext = unknown,
>(
	urlFetcher: UseMutateAsyncFunction<TData, TError, TVariables, TContext>,
) => {
	const [isUploading, setIsUploading] = useState(false);
	const [currentProgress, setCurrentProgress] = useState(0);

	const uploadJob = useCallback(
		async (file: File, args: Omit<TVariables, 'fileExtension' | 'objectKey'>) => {
			setIsUploading(true);
			setCurrentProgress(0);

			try {
				const fileExtension = file.name.split('.').pop()?.toLowerCase();

				if (!fileExtension) {
					throw new Error('Invalid file extension');
				}

				const objectKey = crypto.randomUUID();
				const uploadUrl = await urlFetcher({
					...args,
					fileExtension,
					objectKey,
				} as TVariables);

				if (!uploadUrl.url) throw new Error('Invalid upload URL');

				await axios
					.put(uploadUrl.url, file, {
						onUploadProgress: (progressEvent) => {
							if (!progressEvent.total) return;
							const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
							setCurrentProgress(progress);
						},
					})
					.finally(() => setIsUploading(false));

				return `${objectKey}.${fileExtension}`;
			} finally {
				setIsUploading(false);
			}
		},
		[urlFetcher],
	);

	return {
		isUploading,
		currentProgress,
		uploadJob,
	};
};
