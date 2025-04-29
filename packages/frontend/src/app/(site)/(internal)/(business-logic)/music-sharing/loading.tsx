import type { FC } from 'react';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const MusicSharingLoadingPage: FC = () => {
	return (
		<>
			<Card className="tablet:w-fit px-2" glass>
				<CardHeader className="py-12">
					<CardTitle hidden>Music Sharing</CardTitle>
					<Skeleton className="h-12 w-full tablet:w-[310px]" />
				</CardHeader>
			</Card>
			<Skeleton className="w-full tablet:w-[45rem] h-96" />
		</>
	);
};

export default MusicSharingLoadingPage;
