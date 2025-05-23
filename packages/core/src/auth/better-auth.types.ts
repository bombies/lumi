export type ProviderAccount = {
	id: string;
	provider: string;
	createdAt: Date;
	updatedAt: Date;
	accountId: string;
	scopes: string[];
};

export type SpotifyProviderDatabaseAccount = {
	providerId: 'spotify';
	id: string;
	accountId: string;
	userId: string;
	accessToken: string;
	refreshToken: string;
	idToken: string | null;
	accessTokenExpiresAt: Date;
	refreshTokenExpiresAt: Date | null;
	scope: string[];
	password: null;
	createdAt: Date;
	updatedAt: Date;
};
