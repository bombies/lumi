export const ACCESS_TOKEN_EXPIRY_MS = /* 1 * 24 * 60 * 60 * 1000 */ 10 * 1000; // 1 day
export const REFRESH_TOKEN_EXPIRY_MS = /* 30 * 24 * 60 * 60 * 1000 */ 20 * 1000; // 30 days

export const spotifyApiScopes = [
	'playlist-read-private',
	'playlist-read-collaborative',
	'playlist-modify-private',
	'playlist-modify-public',
	'user-read-currently-playing',
	'user-read-recently-played',
	'user-read-playback-position',
	'user-top-read',
	'user-library-read',
	'user-library-modify',
];
