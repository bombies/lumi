'use client';

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GetMoments } from '@/hooks/trpc/moment-hooks';
import { TagIcon } from '@heroicons/react/24/solid';

import { SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import MomentsGridContent from './moments-grid-content';

const MomentsGrid: FC = () => {
	const [search, setSearch] = useState('');
	const [isSearching, setIsSearching] = useState(false);
	const {
		data: momentPages,
		isLoading: momentsLoading,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage,
	} = GetMoments(undefined, { search: search.length ? search : undefined });

	return (
		<div>
			<div className="flex gap-2">
				<Input
					onValueChange={() => {
						setIsSearching(true);
					}}
					onTypingEnd={(val) => {
						setSearch(val);
						setIsSearching(false);
					}}
					startContent={<SearchIcon />}
					placeholder="Search for a moment"
					typingEndDelay={500}
					className="tablet:w-96"
				/>
				<Link href="/moments/tagged">
					<Button variant="default:flat">
						<TagIcon className="size-[18px]" />
						{' '}
						Tags
					</Button>
				</Link>
			</div>
			<MomentsGridContent
				momentPages={momentPages}
				momentsLoading={momentsLoading}
				isSearching={isSearching}
				searchActive={!!search}
				infiniteOpts={{
					hasNextPage,
					fetchNextPage,
					isFetchingNextPage,
				}}
			/>
		</div>
	);
};

export default MomentsGrid;
