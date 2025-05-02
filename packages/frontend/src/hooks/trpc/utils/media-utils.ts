'use client';

import type { DefaultError, UseMutateAsyncFunction } from '@tanstack/react-query';
import axios from 'axios';
import { useCallback, useState } from 'react';

export const useSingleMediaUploader = <
	TData = unknown,
	TError = DefaultError,
	TVariables extends { fileExtension: string; objectKey: string } | void = void,
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

				if (typeof uploadUrl !== 'string') throw new Error('Invalid upload URL');

				await axios
					.put(uploadUrl, file, {
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
