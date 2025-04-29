import type { FC } from 'react';

import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export const MomentItemSkeleton: FC = () => {
	return <Skeleton className="w-full rounded-md h-96 phone-big:h-[36rem]" />;
};

const HomeLoadingPage: FC = () => {
	return (
		<>
			<div className="space-y-6 laptop:space-y-12 max-w-[45rem]">
				<div>
					<Skeleton className="h-10 w-36 mb-3" />
					<Skeleton className="h-6 w-72" />
				</div>
				<Skeleton className="h-32 rounded-md p-6 space-y-4" />
				<Separator />
				<div className="space-y-4">
					<Skeleton className="w-72 h-10" />
					<div className="grid grid-cols-2 gap-2">
						<MomentItemSkeleton />
						<MomentItemSkeleton />
						<MomentItemSkeleton />
						<MomentItemSkeleton />
					</div>
				</div>
				<Separator />
				<Skeleton className="max-w-[45rem] h-[35rem] rounded-md" />
			</div>
		</>
	);
};

export default HomeLoadingPage;
