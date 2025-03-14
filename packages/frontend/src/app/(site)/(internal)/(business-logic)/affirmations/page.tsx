import { FC } from 'react';

import Title from '@/components/ui/title';
import ReceivedAffirmationsContainer from './components/received-affirmations-container';

const AffirmationsPage: FC = () => {
	return (
		<>
			<Title>Affirmations</Title>
			<ReceivedAffirmationsContainer />
		</>
	);
};

export default AffirmationsPage;
