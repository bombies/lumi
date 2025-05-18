'use client';

import type { FC } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { auth } from '@/lib/better-auth/auth-client';
import { logger } from '@/lib/logger';

type Props = {
	next?: string;
};

const SpotifyLinkButton: FC<Props> = ({ next }) => {
	return (
		<Button
			className="bg-foreground hover:bg-foreground/80 text-background"
			onClick={async () => {
				const redirectUrl = `https://${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}${next || ''}`;
				console.log(redirectUrl);

				const response = await auth.linkSocial({
					provider: 'spotify',
					callbackURL: redirectUrl,
				});

				if (response.data) {
					window.location.href = response.data.url;
				} else {
					logger.error('Failed to link Spotify account', response.error);
					toast.error('Failed to link Spotify account');
				}
			}}
		>
			Connect Your Spotify Account
		</Button>
	);
};

export default SpotifyLinkButton;
