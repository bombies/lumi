'use client';

import { FC } from 'react';
import { MusicalNoteIcon } from '@heroicons/react/24/solid';

import { Button } from '@/components/ui/button';

const RecommendSongButton: FC = () => {
	return (
		<Button>
			<MusicalNoteIcon className="size-[18px] mr-2" /> Recommend Song
		</Button>
	);
};

export default RecommendSongButton;
