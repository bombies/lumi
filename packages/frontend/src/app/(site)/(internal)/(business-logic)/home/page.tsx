'use client';

import type { FC } from 'react';

import { useRelationship } from '@/components/providers/relationships/relationship-provder';
import { Separator } from '@/components/ui/separator';
import AffirmationWidget from './widgets/affirmation-widget';
import MomentsWidget from './widgets/moments-widget';
import MusicWidget from './widgets/music-widget';

const HomePage: FC = () => {
	const { self: user, partner } = useRelationship();

	return (
		<>
			<div className="space-y-6 laptop:space-y-12 max-w-[45rem]">
				<div>
					<h1 className="font-bold text-5xl">
						hey
						{' '}
						<span className="text-primary">{user.firstName}</span>
					</h1>
					<h3 className="text-2xl font-light tablet:max-w-xs">
						welcome back to your space with
						{' '}
						<span className="text-primary font-bold">{partner?.firstName}</span>
					</h3>
				</div>
				<AffirmationWidget />
				<Separator />
				<MomentsWidget />
				<Separator />
				<MusicWidget />
			</div>
		</>
	);
};

export default HomePage;
