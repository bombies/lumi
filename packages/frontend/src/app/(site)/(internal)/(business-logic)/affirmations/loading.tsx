import { FC } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import AffirmationGroupSkeleton from './components/affirmation-group-skeleton';
import MostRecentAffirmationSkeleton from './components/most-recent-affirmation-skeleton';

const AffirmationLoadingPage: FC = () => {
	return (
		<>
			<Skeleton className="w-72 h-14" />
			<Skeleton className="w-48 h-10" />
			<div className="space-y-6 w-full tablet:w-[45rem]">
				<MostRecentAffirmationSkeleton />
				<div className="space-y-8">
					<AffirmationGroupSkeleton />
					<AffirmationGroupSkeleton />
					<AffirmationGroupSkeleton />
				</div>
			</div>
		</>
	);
};

export default AffirmationLoadingPage;
