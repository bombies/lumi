'use client';

import { useEffect, useState } from 'react';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { UserIdentity } from '@supabase/supabase-js';

import { spotifyApiScopes } from '@/app/(site)/(internal)/settings/relationship/components/music-sharing/spotify-link-button';
import { useSupabaseBrowserClient } from '../supabase/client';
import { useLocalStorage } from './useLocalStorage';

export type UseSpotifyAPIArgs = {
	spotifyIdentity?: UserIdentity;
	loadOnMissingIdentity?: boolean;
};

export const useSpotifyAPI = (args?: UseSpotifyAPIArgs) => {
	const supabase = useSupabaseBrowserClient();
	const storage = useLocalStorage();
	const [spotifyAPI, setSpotifyAPI] = useState<SpotifyApi>();
	const [isLinked, setIsLinked] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(true);
	useEffect(() => {
		(async () => {
			if (!storage) {
				return;
			}

			if (!args?.spotifyIdentity || args.spotifyIdentity.provider !== 'spotify') {
				if (args?.loadOnMissingIdentity === false) {
					setLoading(false);
					return;
				}

				const userIdenities = await supabase.auth.getUserIdentities();

				if (userIdenities.error) {
					console.error('There was an error fetching user identities!', userIdenities.error);
					setLoading(false);
					return;
				}

				const spotifyIdentity = userIdenities.data.identities.find(identity => identity.provider === 'spotify');
				if (!spotifyIdentity) {
					setLoading(false);
					return;
				}
			}

			setIsLinked(true);

			const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
			if (sessionError) {
				console.error('There was an error fetching the session!', sessionError);
				setLoading(false);
				return;
			}

			console.log(sessionData.session);
			const spotifyProviderToken = storage.getItem<string>('oauth_provider_token');
			const spotifyRefreshToken = storage.getItem<string>('oauth_provider_refresh_token');
			if (!spotifyProviderToken) {
				const response = await supabase.auth.signInWithOAuth({
					provider: 'spotify',
					options: {
						scopes: spotifyApiScopes.join(' '),
						redirectTo: `${process.env.NEXT_PUBLIC_CANONICAL_URL}/auth/callback?next=${encodeURIComponent('/music-sharing')}`,
					},
				});

				if (response.error) {
					console.error('Failed to get the Spotify tokens!');
					setLoading(false);
					return;
				}
			}

			setSpotifyAPI(
				SpotifyApi.withAccessToken(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!, {
					access_token: spotifyProviderToken,
					refresh_token: spotifyRefreshToken!,
					token_type: sessionData.session!.token_type,
					expires_in: sessionData.session!.expires_in,
				}),
			);
			setLoading(false);
		})();
	}, [args?.loadOnMissingIdentity, args?.spotifyIdentity, storage, supabase.auth]);

	return { spotifyAPI, isLinked, loading };
};

export type UseSpotifyAPIReturnType = ReturnType<typeof useSpotifyAPI>;
