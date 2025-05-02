import type { FC } from 'react';
import BreadcrumbBuilder from '@/components/ui/breadcrumb-builder';
import { Button } from '@/components/ui/button';

import Title from '@/components/ui/title';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import ReceivedAffirmationsContainer from './components/received-affirmations-container';
import SendCustomAffirmationButton from './components/send-custom-affirmation-button';

const AffirmationsPage: FC = () => {
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
				]}
			/>
			<Title>Affirmations</Title>
			<div className="flex flex-col tablet:flex-row gap-2">
				<Link href="/affirmations/manage">
					<Button variant="default:flat">
						<WrenchScrewdriverIcon className="size-[18px]" />
						{' '}
						Manage Affirmations
					</Button>
				</Link>
				<SendCustomAffirmationButton />
			</div>
			<ReceivedAffirmationsContainer />
		</>
	);
};

export default AffirmationsPage;
