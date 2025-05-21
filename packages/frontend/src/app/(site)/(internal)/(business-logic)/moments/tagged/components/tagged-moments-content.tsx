'use client';

import type { FC } from 'react';
import { Grid2X2Icon, Grid3X3Icon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import CompactTaggedMomentsView from './compact-tagged-moments-view';
import SpaciousTaggedMomentsView from './spacious-tagged-moments-view';
import TaggedMomentsProvider from './tagged-moments-provider';

export const TaggedMomentsContent: FC = () => {
	const [selectedView, setSelectedView] = useState<'spacious' | 'compact'>('spacious');

	return (
		<TaggedMomentsProvider>
			<div className="flex gap-2">
				<Button
					variant={selectedView === 'spacious' ? 'accent' : 'default:flat'}
					onClick={() => setSelectedView('spacious')}
				>
					<Grid2X2Icon className="size-[18px]" />
					{' '}
					Spacious View
				</Button>
				<Button
					variant={selectedView === 'compact' ? 'accent' : 'default:flat'}
					onClick={() => setSelectedView('compact')}
				>
					<Grid3X3Icon className="size-[18px]" />
					{' '}
					Compact View
				</Button>
			</div>
			{selectedView === 'spacious' ? <SpaciousTaggedMomentsView /> : <CompactTaggedMomentsView />}
		</TaggedMomentsProvider>
	);
};

export default TaggedMomentsContent;
