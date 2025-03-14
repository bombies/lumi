import { useCallback, useRef } from 'react';

export const useInfiniteLoader = ({
	loading,
	hasMoreData,
	loadMoreData,
}: {
	loading: boolean;
	hasMoreData: boolean;
	loadMoreData: () => void;
}) => {
	const interactionObserver = useRef<IntersectionObserver | null>(null);

	const loadMoreResultsRef = useCallback(
		(node: HTMLDivElement | null) => {
			if (loading || !hasMoreData) return;
			if (interactionObserver.current) interactionObserver.current.disconnect();

			interactionObserver.current = new IntersectionObserver(entries => {
				if (entries[0].isIntersecting) loadMoreData();
			});

			if (node) interactionObserver.current.observe(node);
		},
		[hasMoreData, loadMoreData, loading],
	);

	return loadMoreResultsRef;
};
