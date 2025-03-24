'use client';

import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { skipToken, useQuery } from '@tanstack/react-query';

import { useSpotifyData } from '@/app/(site)/(internal)/(business-logic)/music-sharing/components/spotify-provider';
import { useLocalStorage } from '../useLocalStorage';

const useSpotifyQuery = <T>(path: string, queryCb: (api: SpotifyApi) => Promise<T>) => {
	const {
		api: { spotifyAPI },
	} = useSpotifyData();
	const storage = useLocalStorage();
	return useQuery({
		queryKey: ['spotifyQueries', path],
		queryFn: !spotifyAPI
			? skipToken
			: () =>
					queryCb(spotifyAPI).catch(async e => {
						if (!spotifyAPI || !storage) return;
						if (e instanceof Error && e.message.includes('expired token')) {
							const refreshToken = storage.getItem<string>('oauth_provider_refresh_token');
							if (!refreshToken) throw new Error('Spotify refresh token not available!');
							const url = 'https://accounts.spotify.com/api/token';

							const payload = {
								method: 'POST',
								headers: {
									'Content-Type': 'application/x-www-form-urlencoded',
								},
								body: new URLSearchParams({
									grant_type: 'refresh_token',
									refresh_token: refreshToken,
									client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
								}),
							};
							const body = await fetch(url, payload);
							const response = await body.json();

							storage.setItem('oauth_provider_token', response.access_token);
							storage.setItem('oauth_provider_refresh_token', response.refresh_token);
							return queryCb(spotifyAPI);
						}
					}),
	});
};

export default useSpotifyQuery;
