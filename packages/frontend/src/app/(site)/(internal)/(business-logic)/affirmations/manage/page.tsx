import { FC } from 'react';

import Title from '@/components/ui/title';
import AffirmationsTable from './components/affirmations-table';

const AffirmationManagementPage: FC = () => {
	return (
		<>
			<Title>Affirmations Management</Title>
			<AffirmationsTable />
		</>
	);
};

export default AffirmationManagementPage;
