import { FC } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import Title from '@/components/ui/title';
import ReceivedAffirmationsContainer from './components/received-affirmations-container';

const AffirmationsPage: FC = () => {
	return (
		<>
			<Title>Affirmations</Title>
			<Link href="/affirmations/manage">
				<Button>Manage Affirmations</Button>
			</Link>
			<ReceivedAffirmationsContainer />
		</>
	);
};

export default AffirmationsPage;
