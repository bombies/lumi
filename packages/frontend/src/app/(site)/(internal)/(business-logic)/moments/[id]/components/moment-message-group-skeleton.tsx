'use client';

import type { FC } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type MomentMessageContainerSkeletonProps = {
	isSelf?: boolean;
};

const MomentMessageContainerSkeleton: FC<MomentMessageContainerSkeletonProps> = ({ isSelf }) => {
	return (
		<div className={cn('w-full flex justify-end gap-1 self-end', !isSelf && 'flex-row-reverse')}>
			<div className={cn(
				'space-y-1 flex max-w-3/4 flex-col',
				isSelf && 'items-end',
			)}
			>
				<Skeleton className="w-64 h-24" />
				<Skeleton className="w-48 h-8" />
				<Skeleton className="w-16 h-8" />
			</div>
			<Skeleton className="rounded-full size-8" />
		</div>
	);
};

const MomentMessageGroupSkeleton: FC = () => {
	return (
		<div className="space-y-2">
			<Skeleton className="rounded-sm w-24 h-2 mx-auto" />
			<MomentMessageContainerSkeleton isSelf />
			<MomentMessageContainerSkeleton />
			<MomentMessageContainerSkeleton isSelf />
			<MomentMessageContainerSkeleton />
		</div>
	);
};

export default MomentMessageGroupSkeleton;
