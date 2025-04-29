import type { FC, PropsWithChildren } from 'react';

import { requireSpotifyLink } from '@/lib/actions/requireSpotifyLink';
import SpotifyProvider from './components/spotify-provider';

const MusicSharingLayout: FC<PropsWithChildren> = async ({ children }) => {
	const spotifyIdentity = await requireSpotifyLink();
	return <SpotifyProvider identity={spotifyIdentity}>{children}</SpotifyProvider>;
};

export default MusicSharingLayout;
