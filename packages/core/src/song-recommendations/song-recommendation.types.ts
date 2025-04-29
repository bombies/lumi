import type { EntityType } from '../utils/dynamo/dynamo.types';

export type SongRecommendation = {
	id: string;
	listened: boolean;
	rating?: number;
	comments?: string;
	recommenderId: string;
	relationshipId: string;
	createdAt: string;
	updatedAt?: string;
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
	gsi3pk?: string;
	gsi3sk?: string;
	entityType: EntityType.SONG_RECOMMENDATION;
};
