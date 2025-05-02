import type { FC } from 'react';

import BreadcrumbBuilder from '@/components/ui/breadcrumb-builder';
import Title from '@/components/ui/title';
import AffirmationsTable from './components/affirmations-table';

const AffirmationManagementPage: FC = () => {
	return (
		<>
			<BreadcrumbBuilder
				breadcrumbs={[
					{
						label: 'Home',
						href: '/home',
					},
					{
						label: 'Affirmations',
						href: '/affirmations',
					},
					{
						label: 'Affirmations Management',
						href: '/affirmations/manage',
					},
				]}
			/>
			<Title>Affirmations Management</Title>
			<AffirmationsTable />
		</>
	);
};

export default AffirmationManagementPage;
