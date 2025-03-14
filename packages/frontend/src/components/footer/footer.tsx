'use client';

import { FC } from 'react';
import { CameraIcon, HeartIcon, HomeIcon, MusicalNoteIcon, UserCircleIcon } from '@heroicons/react/24/solid';

import FooterItem from '@/components/footer/footer-item';

const Footer: FC = () => {
	return (
		<footer className="fixed bottom-5 w-full flex justify-center">
			<nav className="w-[95%] phone-big:w-fit border border-foreground/15 bg-background/50 backdrop-blur-lg rounded-3xl p-2 flex gap-2 justify-between">
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
