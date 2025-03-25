'use client';

import { FC } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useIsIOS } from '@/lib/hooks/useIsIOS';
import { useIsStandalone } from '@/lib/hooks/useIsStandalone';
import { logger } from '@/lib/logger';
import { useSupabaseBrowserClient } from '@/lib/supabase/client';

export const spotifyApiScopes = [
	'playlist-read-private',
	'playlist-read-collaborative',
	'playlist-modify-private',
	'playlist-modify-public',
	'user-read-currently-playing',
	'user-read-recently-played',
	'user-read-playback-position',
	'user-top-read',
	'user-library-read',
	'user-library-modify',
];

type Props = {
	next?: string;
};

const SpotifyLinkButton: FC<Props> = ({ next }) => {
	const supabase = useSupabaseBrowserClient();
	const isIOS = useIsIOS();
	const isStandalone = useIsStandalone();
	const router = useRouter();
	return (
		<Button
			className="bg-foreground hover:bg-foreground/80 text-background"
			onClick={async () => {
				if (isIOS && isStandalone)
					return toast.info(
						"You can't link your Spotify account in standalone mode on iOS! You must visit the website in Safari and link your account there.",
					);

				const response = await supabase.auth.linkIdentity({
					provider: 'spotify',
					options: {
						scopes: spotifyApiScopes.join(' '),
						redirectTo: `${process.env.NEXT_PUBLIC_CANONICAL_URL}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`,
					},
				});

				if (response.data) router.refresh();
				else {
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
