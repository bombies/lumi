'use client';

import { FC } from 'react';
import { ProviderAccount } from '@lumi/core/types/better-auth.types';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { auth } from '@/lib/better-auth/auth-client';
import { logger } from '@/lib/logger';

type Props = {
	spotifyIdentity: ProviderAccount;
};

const SpotifyUnlinkButton: FC<Props> = ({ spotifyIdentity }) => {
	const queryClient = useQueryClient();
	return (
		<Button
			className="bg-foreground dark:bg-background hover:bg-foreground/80 hover:dark:bg-background/80 text-background dark:text-foreground"
			onClick={async () => {
				toast.promise(
					auth.unlinkAccount({
						providerId: 'spotify',
						accountId: spotifyIdentity.accountId,
					}),
					{
						loading: 'Disconnecting your Spotify account...',
						success(response) {
							if (response.data) {
								queryClient.invalidateQueries({
									queryKey: ['user-accounts'],
								});
								window.location.reload();
								return 'Successfully disconnected your Spotify account!';
							} else {
								logger.error('Failed to unlink Spotify account', response.error);
								return 'Failed to unlink Spotify account';
							}
						},
						error: 'Failed to disconnect your Spotify Account',
					},
				);
			}}
		>
			Disconnect Your Spotify Account
		</Button>
	);
};

export default SpotifyUnlinkButton;
