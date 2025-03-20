'use client';

import { FC } from 'react';
import { CameraIcon, HeartIcon, HomeIcon, MusicalNoteIcon, UserCircleIcon } from '@heroicons/react/24/solid';

import FooterItem from '@/components/footer/footer-item';
import { cn } from '@/lib/utils';

type Props = {
	docked?: boolean;
};

const Footer: FC<Props> = ({ docked }) => {
	return (
		<footer className={cn('fixed bottom-5 w-full flex justify-center', docked && 'bottom-0')}>
			<nav
				className={cn(
					'w-[95%] phone-big:w-fit border border-foreground/15 bg-background/50 backdrop-blur-lg rounded-3xl p-2 flex gap-2 justify-between',
					docked && 'w-full phone-big:w-full phone-big:justify-center rounded-none',
				)}
			>
				<FooterItem label="Home" href="/home" icon={HomeIcon} />
				<FooterItem label="Moments" href="/moments" icon={CameraIcon} />
				<FooterItem label="Affirmations" href="/affirmations" icon={HeartIcon} />
				<FooterItem label="Music" href="/music-sharing" icon={MusicalNoteIcon} />
				<FooterItem label="You" href="/settings" icon={UserCircleIcon} />
			</nav>
		</footer>
	);
};

export default Footer;
