'use client';

import type { FC } from 'react';

import { useInfiniteLoader } from '@/lib/hooks/useInfiniteLoader';
import Spinner from './spinner';

type Props = {
	loading: boolean;
	hasMore: boolean;
	fetchMore: () => void;
};

const InfiniteLoader: FC<Props> = ({ loading, hasMore, fetchMore }) => {
	const loaderRef = useInfiniteLoader({
		loading,
		hasMoreData: hasMore,
		loadMoreData: fetchMore,
	});

	return hasMore
		? (
				<div className="w-full flex justify-center" ref={loaderRef}>
					<Spinner />
				</div>
			)
		: undefined;
};

export default InfiniteLoader;
