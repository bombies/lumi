import type { FC } from 'react';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import Title from '@/components/ui/title';
import MusicSharingContent from './components/containers/music-sharing-content';

const MusicSharingPage: FC = () => {
	return (
		<>
			<Card className="tablet:w-fit px-2" glass>
				<CardHeader className="py-12">
					<CardTitle>
						<Title>Music Sharing</Title>
					</CardTitle>
				</CardHeader>
			</Card>
			<MusicSharingContent />
		</>
	);
};

export default MusicSharingPage;
