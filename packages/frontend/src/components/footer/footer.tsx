'use client';

import { FC, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { CameraIcon, HeartIcon, HomeIcon, MusicalNoteIcon } from '@heroicons/react/24/solid';

import FooterItem from '@/components/footer/footer-item';
import { cn } from '@/lib/utils';

const DOCKED_MATHCERS = [/^\/moments\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/g];

const Footer: FC = () => {
	const pathName = usePathname();
	const docked = useMemo(() => DOCKED_MATHCERS.some(matcher => matcher.test(pathName)), [pathName]);
	return (
		<footer
			className={cn(
				'fixed bottom-8 laptop:bottom-5 w-full flex justify-center',
				docked && 'block static w-screen',
			)}
		>
			<nav
				className={cn(
					'w-[95%] phone-big:w-fit border border-foreground/15 bg-background/50 backdrop-blur-lg rounded-3xl p-2 flex gap-2 justify-between',
					docked && 'w-full phone-big:w-full phone-big:justify-center rounded-none border-x-0 border-b-0',
				)}
			>
				<FooterItem label="Home" href="/home" icon={HomeIcon} />
				<FooterItem label="Moments" href="/moments" icon={CameraIcon} />
				<FooterItem label="Affirmations" href="/affirmations" icon={HeartIcon} />
				<FooterItem label="Music" href="/music-sharing" icon={MusicalNoteIcon} />
			</nav>
		</footer>
	);
};

export default Footer;
