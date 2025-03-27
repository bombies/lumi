'use client';

import { useRouter } from 'next/navigation';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { usePullToRefresh } from 'use-pull-to-refresh';

import { useIsIOS } from '../lib/hooks/useIsIOS';
import { useIsStandalone } from '../lib/hooks/useIsStandalone';

const MAXIMUM_PULL_LENGTH = 240;
const REFRESH_THRESHOLD = 80;

export const PullRefresh = () => {
	const isIOS = useIsIOS();
	const isStandalone = useIsStandalone();
	const router = useRouter();

	const { isRefreshing, pullPosition } = usePullToRefresh({
		onRefresh: () => router.refresh(),
		maximumPullLength: MAXIMUM_PULL_LENGTH,
		refreshThreshold: REFRESH_THRESHOLD,
		isDisabled: false,
	});

	return (
		isIOS &&
		isStandalone && (
			<div
				style={{
					top: (isRefreshing ? REFRESH_THRESHOLD : pullPosition) / 3,
					opacity: isRefreshing || pullPosition > 0 ? 1 : 0,
				}}
				className="bg-background text-foreground fixed inset-x-1/2 z-30 h-8 w-8 -translate-x-1/2 rounded-full p-2 shadow"
			>
				<div
					className={`h-full w-full ${isRefreshing ? 'animate-spin' : ''}`}
					style={!isRefreshing ? { transform: `rotate(${pullPosition}deg)` } : {}}
				>
					<ArrowPathIcon className="h-full w-full text-foreground" />
				</div>
			</div>
		)
	);
};
