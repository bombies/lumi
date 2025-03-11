'use client';

import { FC, useEffect, useState } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

const InstallPrompt: FC = () => {
	const [isIOS, setIsIOS] = useState(false);
	const [isStandalone, setIsStandalone] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);

	useEffect(() => {
		setIsIOS(() => {
			const val = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
			if (val) setModalOpen(true);
			return val;
		});

		setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
	}, []);

	if (isStandalone) return null; // Don't show install button if already installed

	return (
		<Dialog open={modalOpen} onOpenChange={setModalOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Install Lumi App</DialogTitle>
				</DialogHeader>
				{isIOS && (
					<p>
						To install this app on your iOS device, tap the share button
						<span role="img" aria-label="share icon">
							{' '}
							⎋{' '}
						</span>
						and then "Add to Home Screen"
						<span role="img" aria-label="plus icon">
							{' '}
							➕{' '}
						</span>
						.
					</p>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default InstallPrompt;
