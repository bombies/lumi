'use client';

import { FC } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const spotifyApiScopes = [
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

const SpotifyLinkButton: FC = () => {
	const supabase = createSupabaseBrowserClient();
	const router = useRouter();
	return (
		<Button
			className="bg-foreground dark:bg-background hover:bg-foreground/80 hover:dark:bg-background/80 text-background dark:text-foreground"
			onClick={async () => {
				const response = await supabase.auth.linkIdentity({
					provider: 'spotify',
					options: {
						scopes: spotifyApiScopes.join(' '),
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
