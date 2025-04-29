import type { FC } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

const MostRecentAffirmationSkeleton: FC = () => {
	return <Skeleton className="w-full h-32 rounded-xl tablet:w-96" />;
};

export default MostRecentAffirmationSkeleton;
