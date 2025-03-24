'use client';

import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { skipToken, useQuery } from '@tanstack/react-query';

import { useSpotifyData } from '@/app/(site)/(internal)/(business-logic)/music-sharing/components/spotify-provider';

const useSpotifyQuery = <T>(path: string, queryCb: (api: SpotifyApi) => Promise<T>) => {
	const {
		api: { spotifyAPI },
	} = useSpotifyData();
	return useQuery({
		queryKey: ['spotifyQueries', path],
		queryFn: !spotifyAPI ? skipToken : () => queryCb(spotifyAPI),
	});
};

export default useSpotifyQuery;
