'use client';

import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { skipToken, useQuery } from '@tanstack/react-query';

import { useSpotifyData } from '@/app/(site)/(internal)/(business-logic)/music-sharing/components/spotify-provider';
import { auth } from '@/lib/better-auth/auth-client';
import { logger } from '@/lib/logger';

const useSpotifyQuery = <T>(path: string, queryCb?: (api: SpotifyApi) => Promise<T>) => {
	const {
		api: { spotifyAPI, setTokens },
		identity,
	} = useSpotifyData();
	return useQuery({
		queryKey: ['spotifyQueries', path],
		queryFn:
			!spotifyAPI || !queryCb
				? skipToken
				: () =>
						queryCb(spotifyAPI).catch(async e => {
							if (!spotifyAPI) return;
							if (!identity) throw new Error('Identity not found. Cannot refresh the Spotify token.');

							if (e instanceof Error && e.message.includes('expired token')) {
								const response = await auth.refreshToken({
									providerId: identity.provider,
									accountId: identity.id,
								});

								if (response.error) {
									logger.error('Failed to get the Spotify tokens!', response.error);
									return;
								} else if (response.data) {
									setTokens({
										accessToken: response.data.accessToken!,
										refreshToken: response.data.refreshToken!,
										accessTokenExpiresAt: response.data.accessTokenExpiresAt!,
									});
									return queryCb(spotifyAPI);
								}
							}
						}),
	});
};

export default useSpotifyQuery;
