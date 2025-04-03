import { FC } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import Title from '@/components/ui/title';
import ReceivedAffirmationsContainer from './components/received-affirmations-container';
import SendCustomAffirmationButton from './components/send-custom-affirmation-button';

const AffirmationsPage: FC = () => {
	return (
		<>
			<Title>Affirmations</Title>
			<div className="flex flex-col tablet:flex-row gap-2">
				<Link href="/affirmations/manage">
					<Button variant="default:flat">Manage Affirmations</Button>
				</Link>
				<SendCustomAffirmationButton />
			</div>
			<ReceivedAffirmationsContainer />
		</>
	);
};

export default AffirmationsPage;
