import type { DynamoEntityType, DynamoGSI1Keys, DynamoGSI2Keys, DynamoGSI3Keys, DynamoRecord } from '@/lib/api/types/dynamo.types';

export type RecommendedSpotifyTrack = {
	id: string;
	uri: string;
	name: string;
	artistName: string;
	albumImage?: string;
	duration: number;
};

export type SongRecommendation = DynamoRecord<DynamoEntityType.SONG_RECOMMENDATION>
	& DynamoGSI1Keys & DynamoGSI2Keys & Partial<DynamoGSI3Keys> & {
		id: string;
		listened: boolean;
		rating?: number;
		comments?: string;
		recommenderId: string;
		relationshipId: string;
		createdAt: string;
		updatedAt: string;
		track: RecommendedSpotifyTrack;
	};
