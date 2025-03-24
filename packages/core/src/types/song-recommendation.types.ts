export type SongRecommendation = {
	id: string;
	listened: boolean;
	recommenderId: string;
	relationshipId: string;
	createdAt: string;
	track: RecommendationSpotifyTrack;
};

export type RecommendationSpotifyTrack = {
	id: string;
	uri: string;
	name: string;
	artistName: string;
	albumImage?: string;
	duration: number;
};

export type DatabaseSongRecommendation = SongRecommendation & {
	pk: string;
	sk: string;
	gsi1pk: string;
	gsi1sk: string;
	gsi2pk: string;
	gsi2sk: string;
};
