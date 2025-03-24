'use client';

import { createContext, FC, PropsWithChildren, useContext, useMemo } from 'react';
import { UserIdentity } from '@supabase/supabase-js';

import { useSpotifyAPI, UseSpotifyAPIReturnType } from '@/lib/hooks/useSpotifyAPI';

type SpotifyProviderData = {
	isLinked: boolean;
	api: UseSpotifyAPIReturnType;
};

type SpotifyProviderProps = PropsWithChildren<{
	identity?: UserIdentity;
}>;

const SpotifyContext = createContext<SpotifyProviderData | undefined>(undefined);

export const useSpotifyData = () => {
	const context = useContext(SpotifyContext);
	if (!context) throw new Error('useSpotifyData must be used within a SpotifyProvider');
	return context;
};

const SpotifyProvider: FC<SpotifyProviderProps> = ({ identity, children }) => {
	const spotifyAPIData = useSpotifyAPI({
		spotifyIdentity: identity,
		loadOnMissingIdentity: false,
	});

	const memoizedValues = useMemo<SpotifyProviderData>(
		() => ({
			isLinked: !!identity,
			api: spotifyAPIData,
		}),
		[identity, spotifyAPIData],
	);

	return <SpotifyContext.Provider value={memoizedValues}>{children}</SpotifyContext.Provider>;
};

export default SpotifyProvider;
