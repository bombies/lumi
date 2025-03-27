'use client';

import { useEffect, useState } from 'react';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';

import { auth } from '../better-auth/auth-client';
import { logger } from '../logger';

export const useSpotifyAPI = () => {
	const { data: session } = auth.useSession();
	const [spotifyAPI, setSpotifyAPI] = useState<SpotifyApi>();
	const [isLinked, setIsLinked] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(true);
	const [tokens, setTokens] = useState<{ accessToken: string; refreshToken: string; accessTokenExpiresAt: Date }>();
	useEffect(() => {
		if (!session) return;

		(async () => {
			console.log('session tokens', session.tokens);
			const spotifyProviderToken = tokens?.accessToken ?? session.tokens.spotify?.accessToken;
			const spotifyRefreshToken = tokens?.refreshToken ?? session.tokens.spotify?.refreshToken;

			if (!spotifyProviderToken || !spotifyRefreshToken) {
				logger.error('Failed to set the Spotify tokens!');
				setLoading(false);
				return;
			}

			setIsLinked(true);

			setSpotifyAPI(
				SpotifyApi.withAccessToken(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!, {
					access_token: spotifyProviderToken,
					refresh_token: spotifyRefreshToken,
					token_type: 'Bearer',
					expires_in: (
						tokens?.accessTokenExpiresAt ?? session.tokens.spotify!.accessTokenExpiresAt
					).getTime(),
				}),
			);
			setLoading(false);
		})();
	}, [session, tokens?.accessToken, tokens?.accessTokenExpiresAt, tokens?.refreshToken]);

	return { spotifyAPI, isLinked, loading, setTokens };
};

export type UseSpotifyAPIReturnType = ReturnType<typeof useSpotifyAPI>;
