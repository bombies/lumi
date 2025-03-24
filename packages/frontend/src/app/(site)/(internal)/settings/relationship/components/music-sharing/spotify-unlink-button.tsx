'use client';

import { FC } from 'react';
import { useRouter } from 'next/navigation';
import { UserIdentity } from '@supabase/supabase-js';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';
import { useSupabaseBrowserClient } from '@/lib/supabase/client';

type Props = {
	spotifyIdentity: UserIdentity;
};

const SpotifyUnlinkButton: FC<Props> = ({ spotifyIdentity }) => {
	const supabase = useSupabaseBrowserClient();
	const router = useRouter();
	return (
		<Button
			className="bg-foreground dark:bg-background hover:bg-foreground/80 hover:dark:bg-background/80 text-background dark:text-foreground"
			onClick={async () => {
				toast.promise(supabase.auth.unlinkIdentity(spotifyIdentity), {
					loading: 'Disconnecting your Spotify account...',
					success(response) {
						if (response.data) {
							router.refresh();
							return 'Successfully disconnected your Spotify account!';
						} else {
							logger.error('Failed to unlink Spotify account', response.error);
							return 'Failed to unlink Spotify account';
						}
					},
					error: 'Failed to disconnect your Spotify Account',
				});
			}}
		>
			Disconnect Your Spotify Account
		</Button>
	);
};

export default SpotifyUnlinkButton;
