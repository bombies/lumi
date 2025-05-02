'use client';

import type { FC } from 'react';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

const InstallPrompt: FC = () => {
	const storage = useLocalStorage();
	const [isIOS, setIsIOS] = useState(false);
	const [isStandalone, setIsStandalone] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);

	useEffect(() => {
		setIsIOS(() => {
			const val = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
			if (val && storage && !storage.getItem<boolean>('iosModalDismissed')) setModalOpen(true);
			return val;
		});

		setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
	}, [storage]);

	if (isStandalone) return null; // Don't show install button if already installed

	return (
		<Dialog
			open={modalOpen}
			onOpenChange={(val) => {
				if (!val) storage?.setItem('iosModalDismissed', true);
				setModalOpen(val);
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Install Lumi App</DialogTitle>
				</DialogHeader>
				{isIOS && (
					<p>To install this app on your iOS device, tap the share button and then "Add to Home Screen" .</p>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default InstallPrompt;
