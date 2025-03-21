import { FC } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

const HomeLoadingPage: FC = () => {
	return (
		<>
			<div>
				<Skeleton className="h-10 w-36 mb-3" />
				<Skeleton className="h-6 w-72" />
			</div>
		</>
	);
};

export default HomeLoadingPage;
