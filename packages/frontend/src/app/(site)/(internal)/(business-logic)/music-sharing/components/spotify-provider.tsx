'use client';

import { createContext, FC, PropsWithChildren, useContext, useMemo } from 'react';
import { ProviderAccount } from '@lumi/core/auth/better-auth.types';

import { useSpotifyAPI, UseSpotifyAPIReturnType } from '@/lib/hooks/useSpotifyAPI';

type SpotifyProviderData = {
	isLinked: boolean;
	identity?: ProviderAccount;
	api: UseSpotifyAPIReturnType;
};

type SpotifyProviderProps = PropsWithChildren<{
	identity?: ProviderAccount;
}>;

const SpotifyContext = createContext<SpotifyProviderData | undefined>(undefined);

export const useSpotifyData = () => {
	const context = useContext(SpotifyContext);
	if (!context) throw new Error('useSpotifyData must be used within a SpotifyProvider');
	return context;
};

const SpotifyProvider: FC<SpotifyProviderProps> = ({ identity, children }) => {
	const spotifyAPIData = useSpotifyAPI();

	const memoizedValues = useMemo<SpotifyProviderData>(
		() => ({
			isLinked: !!identity,
			api: spotifyAPIData,
			identity,
		}),
		[identity, spotifyAPIData],
	);

	return <SpotifyContext.Provider value={memoizedValues}>{children}</SpotifyContext.Provider>;
};

export default SpotifyProvider;
