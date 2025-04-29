import type { FC } from 'react';

import BreadcrumbBuilder from '@/components/ui/breadcrumb-builder';
import Title from '@/components/ui/title';
import TaggedMomentsContent from './components/tagged-moments-content';

const MomentTagsPage: FC = () => {
	return (
		<>
			<BreadcrumbBuilder
				breadcrumbs={[
					{
						label: 'Home',
						href: '/home',
					},
					{
						label: 'Moments',
						href: '/moments',
					},
					{
						label: 'Tagged Moments',
						href: '/moments/tagged',
					},
				]}
			/>
			<Title>Tagged Moments</Title>
			<TaggedMomentsContent />
		</>
	);
};

export default MomentTagsPage;
