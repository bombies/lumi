'use client';

import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { skipToken, useQuery } from '@tanstack/react-query';

import { useSpotifyData } from '@/app/(site)/(internal)/(business-logic)/music-sharing/components/spotify-provider';
import { spotifyApiScopes } from '@/app/(site)/(internal)/settings/relationship/components/music-sharing/spotify-link-button';
import { logger } from '@/lib/logger';
import { useSupabaseBrowserClient } from '@/lib/supabase/client';

const useSpotifyQuery = <T>(path: string, queryCb?: (api: SpotifyApi) => Promise<T>) => {
	const {
		api: { spotifyAPI },
	} = useSpotifyData();
	const supabase = useSupabaseBrowserClient();
	return useQuery({
		queryKey: ['spotifyQueries', path],
		queryFn:
			!spotifyAPI || !queryCb
				? skipToken
				: () =>
						queryCb(spotifyAPI).catch(async e => {
							if (!spotifyAPI) return;
							if (e instanceof Error && e.message.includes('expired token')) {
								const response = await supabase.auth.signInWithOAuth({
									provider: 'spotify',
									options: {
										scopes: spotifyApiScopes.join(' '),
										redirectTo: `https://${window.location.hostname}/auth/callback?next=${encodeURIComponent('/music-sharing')}`,
										skipBrowserRedirect: true,
									},
								});

								if (response.error) {
									logger.error('Failed to get the Spotify tokens!');
									return;
								} else {
									window.location.href = response.data.url;
								}
							}
						}),
	});
};

export default useSpotifyQuery;
