'use client';

import { useCallback, useEffect, useState } from 'react';
import mediaInfoFactory, { FormatType, MediaInfo, ReadChunkFunc } from 'mediainfo.js';

export const useMediaInfo = (type: FormatType) => {
	const [mediaInfo, setMediaInfo] = useState<MediaInfo<typeof type>>();

	useEffect(() => {
		mediaInfoFactory({
			format: type,
			locateFile: filename => `/${filename}`,
		})
			.then(mi => {
				setMediaInfo(mi);
			})
			.catch((error: unknown) => {
				console.error(error);
			});

		return () => {
			mediaInfo?.close();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [type]);

	const makeReadChunk = useCallback<(file: File) => ReadChunkFunc>(
		(file: File) => async (chunkSize: number, offset: number) =>
			new Uint8Array(await file.slice(offset, offset + chunkSize).arrayBuffer()),
		[],
	);

	return { mediaInfo, makeReadChunk };
};
