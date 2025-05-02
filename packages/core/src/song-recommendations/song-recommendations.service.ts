import type { DatabaseSongRecommendation, SongRecommendation } from './song-recommendation.types';

import type {
	CreateSongRecommendationDto,
	GetSongRecommendationsDto,
	UpdateSongRecommendationDto,
} from './song-recommendations.dto';
import { TRPCError } from '@trpc/server';
import { batchWrite, deleteItem, getItem, getItems, putItem, updateItem } from '../utils/dynamo/dynamo.service';
import { DynamoKey, EntityType } from '../utils/dynamo/dynamo.types';
import { chunkArray, getUUID } from '../utils/utils';

export const getSongRecommendationByTrackIdForUser = async (
	userId: string,
	trackId: string,
): Promise<SongRecommendation | undefined> => {
	return getItems<SongRecommendation>({
		index: 'GSI2',
		queryExpression: {
			expression: '#gsi2pk = :gsi2pk and #gsi2sk = :gsi2sk',
			variables: {
				':gsi2pk': DynamoKey.songRecommendation.gsi2pk(userId),
				':gsi2sk': DynamoKey.songRecommendation.gsi2sk(trackId),
			},
		},
	}).then(res => res.data[0]);
};

export const createSongRecommendation = async (
	recommenderId: string,
	relationshipId: string,
	dto: CreateSongRecommendationDto,
) => {
	const existingRecommendation = await getSongRecommendationByTrackIdForUser(recommenderId, dto.id);
	if (existingRecommendation)
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'You have already sent this song recommendation!',
		});

	const recId = getUUID();
	const createdAt = new Date().toISOString();
	const songRec: SongRecommendation = {
		id: recId,
		listened: false,
		relationshipId,
		recommenderId,
		track: dto,
		createdAt,
	};

	await putItem<DatabaseSongRecommendation>({
		pk: DynamoKey.songRecommendation.pk(recId),
		sk: DynamoKey.songRecommendation.sk(recId),
		gsi1pk: DynamoKey.songRecommendation.gsi1pk(relationshipId),
		gsi1sk: DynamoKey.songRecommendation.gsi1sk(recommenderId, false, createdAt),
		gsi2pk: DynamoKey.songRecommendation.gsi2pk(recommenderId),
		gsi2sk: DynamoKey.songRecommendation.gsi2sk(dto.id),
		...songRec,
		entityType: EntityType.SONG_RECOMMENDATION,
	});

	return songRec;
};

export const getSongRecommendations = async (
	partnerId: string,
	relationshipId: string,
	{ limit, cursor, order, ...dto }: GetSongRecommendationsDto,
) => {
	return getItems<SongRecommendation>({
		index: 'GSI1',
		queryExpression: {
			expression: '#gsi1pk = :gsi1pk and begins_with(#gsi1sk, :gsi1sk)',
			variables: {
				':gsi1pk': DynamoKey.songRecommendation.gsi1pk(relationshipId),
				':gsi1sk': DynamoKey.songRecommendation.buildKey(partnerId, dto.filter ?? ''),
			},
		},
		limit,
		cursor,
		order,
	});
};

export const getSongRecommendationsByRelationshipId = async (
	relationshipId: string,
	{ limit, cursor, order }: GetSongRecommendationsDto,
) => {
	return getItems<SongRecommendation>({
		index: 'GSI3',
		queryExpression: {
			expression: '#gsi3pk = :gsi3pk and begins_with(#gsi3sk, :gsi3sk)',
			variables: {
				':gsi3pk': DynamoKey.songRecommendation.gsi3pk(relationshipId),
				':gsi3sk': DynamoKey.songRecommendation.buildKey(relationshipId),
			},
		},
		limit,
		cursor,
		order,
	});
};

export const getSongRecommendationById = async (recId: string) => {
	return getItem<SongRecommendation>(DynamoKey.songRecommendation.pk(recId), DynamoKey.songRecommendation.sk(recId));
};

export const updateSongRecommendation = async (recId: string, dto: UpdateSongRecommendationDto) => {
	const existingRec = await getSongRecommendationById(recId);
	if (!existingRec)
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'Song recommendation not found!',
		});

	const updateTime = new Date().toISOString();
	return updateItem<DatabaseSongRecommendation>({
		pk: DynamoKey.songRecommendation.pk(recId),
		sk: DynamoKey.songRecommendation.sk(recId),
		update: {
			...dto,
			gsi1sk:
				dto.listened !== undefined
					? DynamoKey.songRecommendation.gsi1sk(
							existingRec.recommenderId,
							dto.listened,
							existingRec.createdAt,
						)
					: undefined,
			gsi3pk: DynamoKey.songRecommendation.gsi3pk(existingRec.relationshipId),
			gsi3sk: DynamoKey.songRecommendation.gsi3sk(existingRec.relationshipId, updateTime),
			updatedAt: updateTime,
		},
	});
};

export const deleteSongRecommendation = async (recId: string) => {
	const existingRec = await getSongRecommendationById(recId);
	if (!existingRec)
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'Song recommendation not found!',
		});

	await deleteItem(DynamoKey.songRecommendation.pk(recId), DynamoKey.songRecommendation.sk(recId));
	return existingRec;
};

export const deleteSongRecommendationsByRelationshipId = async (relationshipId: string) => {
	const songRecs = await getItems<SongRecommendation>({
		index: 'GSI1',
		queryExpression: {
			expression: '#gsi1pk = :gsi1pk',
			variables: {
				':gsi1pk': DynamoKey.songRecommendation.gsi1pk(relationshipId),
			},
		},
		exhaustive: true,
	});

	return Promise.all(
		chunkArray(songRecs.data, 25).map(async chunk =>
			batchWrite(
				...chunk.map(chunkItem => ({
					deleteItem: {
						pk: DynamoKey.songRecommendation.pk(chunkItem.id),
						sk: DynamoKey.songRecommendation.sk(chunkItem.id),
					},
				})),
			),
		),
	);
};
