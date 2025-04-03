import { FC } from 'react';

import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { MomentItemSkeleton } from '../home/loading';

const MomentLoadingPage: FC = () => {
	return (
		<>
			<Skeleton className="w-80 h-14" />
			<Skeleton className="w-48 h-10" />
			<div>
				<Skeleton className="w-full tablet:w-96  h-10" />
				<Separator className="my-6" />
				<div className="grid phone-big:grid-cols-2 laptop:grid-cols-3 desktop:grid-cols-4 gap-4">
					<MomentItemSkeleton />
					<MomentItemSkeleton />
					<MomentItemSkeleton />
					<MomentItemSkeleton />
				</div>
			</div>
		</>
	);
};

export default MomentLoadingPage;
