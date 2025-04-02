import { FC } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type Props = {
	className?: string;
};

const MomentCardSkeleton: FC<Props> = ({ className }) => {
	return (
		<div
			className={cn(
				'rounded-md border border-border bg-neutral-300 dark:bg-neutral-700 h-96 phone-big:h-[36rem] overflow-hidden relative',
				className,
			)}
		>
			<div className="absolute bottom-0 w-full max-h-[45%] p-4 bg-neutral-500/50 dark:bg-neutral-800 backdrop-blur-md space-y-2">
				<Skeleton className="w-1/2 h-4 bg-neutral-200" />
				<Skeleton className="w-3/4 h-2 bg-neutral-200" />
				<div className="flex gap-2 items-center">
					<Skeleton className="size-8 rounded-full bg-neutral-200" />
					<Skeleton className="w-20 bg-neutral-200 h-3" />
				</div>
			</div>
		</div>
	);
};

export default MomentCardSkeleton;
