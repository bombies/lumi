import { FC } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

const TrackSearchResultSkeleton: FC = () => {
	return (
		<div className="flex w-full justify-between gap-x-3 items-center hover:bg-white/20 p-2 rounded-md cursor-pointer">
			<div className="flex gap-x-3 items-center">
				<Skeleton className="size-10 aspect-square rounded-sm" />
				<div className="space-y-1">
					<Skeleton className="w-24 h-4 rounded-xs" />
					<Skeleton className="w-16 h-3 rounded-xs" />
				</div>
			</div>
			<Skeleton className="w-8 h-3 rounded-xs" />
		</div>
	);
};

export default TrackSearchResultSkeleton;
