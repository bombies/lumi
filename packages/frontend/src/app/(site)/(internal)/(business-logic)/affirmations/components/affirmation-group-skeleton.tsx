import type { FC } from 'react';

import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

const ReceivedAffirmationSkeleton: FC = () => {
	return (
		<div className="flex items-start gap-2">
			<Skeleton className="h-4 w-8 rounded-sm" />
			<Skeleton className="h-6 w-64" />
		</div>
	);
};

const AffirmationGroupSkeleton: FC = () => {
	return (
		<div className="space-y-4">
			<Skeleton className="w-96 h-10" />
			<Separator />
			<ReceivedAffirmationSkeleton />
			<ReceivedAffirmationSkeleton />
			<ReceivedAffirmationSkeleton />
		</div>
	);
};

export default AffirmationGroupSkeleton;
