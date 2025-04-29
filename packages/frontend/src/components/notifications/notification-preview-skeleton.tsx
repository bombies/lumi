import type { FC } from 'react';

import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';

const NotificationPreviewSkeleton: FC = () => {
	return (
		<div className={cn('flex items-center gap-1 rounded-md px-2 py-4 justify-between')}>
			<div className="w-[75%] flex gap-1">
				<div className="w-full space-y-1">
					<Skeleton className="h-2 w-1/3" />
					<Skeleton className="h-4 w-3/4" />
				</div>
			</div>
			<Skeleton className="h-2 w-8" />
		</div>
	);
};

export default NotificationPreviewSkeleton;
