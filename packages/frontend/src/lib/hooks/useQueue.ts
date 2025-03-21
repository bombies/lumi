'use client';

import { useCallback, useEffect, useState } from 'react';

type UseQueueArgs<T> = {
	initialValue?: T[];
	process?: ((element: T) => void) | ((element: T) => Promise<void>);
	lazyProcess?: boolean;
};

export function useQueue<T>({ initialValue = [], process, lazyProcess }: UseQueueArgs<T>) {
	const [queue, setQueue] = useState(initialValue);
	const [isProcessing, setIsProcessing] = useState(false);
	const [allowedToProcess, setAllowedToProcess] = useState(lazyProcess ? false : true);
	const enqueue = useCallback((element: T) => {
		setQueue(q => [...q, element]);
	}, []);

	const dequeue = useCallback(() => {
		let removedElement;

		setQueue(([first, ...q]) => {
			removedElement = first;
			return q;
		});

		return removedElement;
	}, []);

	const clear = useCallback(() => {
		setQueue([]);
	}, []);

	const startProcessing = useCallback(() => setAllowedToProcess(true), []);

	// Process effects
	useEffect(() => {
		if (isProcessing || !allowedToProcess) return;

		if (process instanceof Promise) {
			(async () => {
				if (queue.length) {
					setIsProcessing(true);
					await process(queue[0]);
					dequeue();
				}
			})();
		} else if (process && queue.length) {
			setIsProcessing(true);
			process(queue[0]);
			dequeue();
		}

		setIsProcessing(false);
	}, [queue, process, dequeue, isProcessing, allowedToProcess]);

	return {
		enqueue,
		dequeue,
		clear,
		first: queue[0],
		last: queue[queue.length - 1],
		size: queue.length,
		queue,
		startProcessing,
	};
}
