import type { FC } from 'react';
import BreadcrumbBuilder from '@/components/ui/breadcrumb-builder';
import { Button } from '@/components/ui/button';

import Title from '@/components/ui/title';
import { UploadIcon } from 'lucide-react';
import Link from 'next/link';
import MomentsGrid from './components/moments-grid';

const MomentsPage: FC = () => {
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
				]}
			/>
			<Title>Your Moments</Title>
			<Link href="/moments/upload">
				<Button variant="accent" className="mb-6">
					<UploadIcon size={18} className="mr-2" />
					{' '}
					Upload Moment
				</Button>
			</Link>
			<MomentsGrid />
		</>
	);
};

export default MomentsPage;
