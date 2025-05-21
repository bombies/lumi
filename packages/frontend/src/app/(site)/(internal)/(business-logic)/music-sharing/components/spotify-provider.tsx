'use client';

import type { ProviderAccount } from '@lumi/core/auth/better-auth.types';
import type { FC, PropsWithChildren } from 'react';
import type { UseSpotifyAPIReturnType } from '@/lib/hooks/useSpotifyAPI';

import { createContext, use, useMemo } from 'react';
import { useSpotifyAPI } from '@/lib/hooks/useSpotifyAPI';

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
	const context = use(SpotifyContext);
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

	return <SpotifyContext value={memoizedValues}>{children}</SpotifyContext>;
};

export default SpotifyProvider;
