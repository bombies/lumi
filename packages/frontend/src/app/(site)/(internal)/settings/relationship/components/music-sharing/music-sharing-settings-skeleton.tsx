import { FC } from 'react';
import { SiSpotify } from '@icons-pack/react-simple-icons';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const MusicSharingSettingsSkeleton: FC = () => {
	return (
		<Card className="bg-accent border border-border">
			<CardHeader>
				<CardTitle className="flex items-center">
					<SiSpotify className="mr-2" /> <p>Your Spotify Account</p>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<Skeleton className="w-48 h-4 bg-secondary" />
					<Skeleton className="w-72 h-10 bg-secondary" />
				</div>
			</CardContent>
		</Card>
	);
};

export default MusicSharingSettingsSkeleton;
