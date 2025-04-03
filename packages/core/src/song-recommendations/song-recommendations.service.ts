import { TRPCError } from '@trpc/server';

import { EntityType, KeyPrefix } from '../types/dynamo.types';
import { DatabaseSongRecommendation, SongRecommendation } from '../types/song-recommendation.types';
import {
	bactchWrite,
	deleteItem,
	dynamo,
	getItem,
	getItems,
	putItem,
	updateItem,
} from '../utils/dynamo/dynamo.service';
import { chunkArray, getUUID } from '../utils/utils';
import {
	CreateSongRecommendationDto,
	GetSongRecommendationsDto,
	UpdateSongRecommendationDto,
} from './song-recommendations.dto';

export const getSongRecommendationByTrackIdForUser = async (
	userId: string,
	trackId: string,
): Promise<SongRecommendation | undefined> => {
	return getItems<SongRecommendation>({
		index: 'GSI2',
		queryExpression: {
			expression: '#gsi2pk = :gsi2pk and #gsi2sk = :gsi2sk',
			variables: {
				':gsi2pk': KeyPrefix.songRecommendation.gsi2pk(userId),
				':gsi2sk': KeyPrefix.songRecommendation.gsi2sk(trackId),
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
		pk: KeyPrefix.songRecommendation.pk(recId),
		sk: KeyPrefix.songRecommendation.sk(recId),
		gsi1pk: KeyPrefix.songRecommendation.gsi1pk(relationshipId),
		gsi1sk: KeyPrefix.songRecommendation.gsi1sk(recommenderId, false, createdAt),
		gsi2pk: KeyPrefix.songRecommendation.gsi2pk(recommenderId),
		gsi2sk: KeyPrefix.songRecommendation.gsi2sk(dto.id),
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
				':gsi1pk': KeyPrefix.songRecommendation.gsi1pk(relationshipId),
				':gsi1sk': KeyPrefix.songRecommendation.buildKey(partnerId, dto.filter ?? ''),
			},
		},
		limit,
		cursor,
		order,
	});
};

export const getSongRecommendationsByRelationshipId = async (
	relationshipId: string,
	{ limit, cursor, order, ...dto }: GetSongRecommendationsDto,
) => {
	return getItems<SongRecommendation>({
		index: 'GSI3',
		queryExpression: {
			expression: '#gsi3pk = :gsi3pk and begins_with(#gsi3sk, :gsi3sk)',
			variables: {
				':gsi3pk': KeyPrefix.songRecommendation.gsi3pk(relationshipId),
				':gsi3sk': KeyPrefix.songRecommendation.buildKey(relationshipId),
			},
		},
		limit,
		cursor,
		order,
	});
};

export const getSongRecommendationById = async (recId: string) => {
	return getItem<SongRecommendation>(KeyPrefix.songRecommendation.pk(recId), KeyPrefix.songRecommendation.sk(recId));
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
		pk: KeyPrefix.songRecommendation.pk(recId),
		sk: KeyPrefix.songRecommendation.sk(recId),
		update: {
			...dto,
			gsi1sk:
				dto.listened !== undefined
					? KeyPrefix.songRecommendation.gsi1sk(
							existingRec.recommenderId,
							dto.listened,
							existingRec.createdAt,
						)
					: undefined,
			gsi3pk: KeyPrefix.songRecommendation.gsi3pk(existingRec.relationshipId),
			gsi3sk: KeyPrefix.songRecommendation.gsi3sk(existingRec.relationshipId, updateTime),
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

	await deleteItem(KeyPrefix.songRecommendation.pk(recId), KeyPrefix.songRecommendation.sk(recId));
	return existingRec;
};

export const deleteSongRecommendationsByRelationshipId = async (relationshipId: string) => {
	const songRecs = await getItems<SongRecommendation>({
		index: 'GSI1',
		queryExpression: {
			expression: '#gsi1pk = :gsi1pk',
			variables: {
				':gsi1pk': KeyPrefix.songRecommendation.gsi1pk(relationshipId),
			},
		},
		exhaustive: true,
	});

	return Promise.all(
		chunkArray(songRecs.data, 25).map(async chunk =>
			bactchWrite(
				...chunk.map(chunkItem => ({
					deleteItem: {
						pk: KeyPrefix.songRecommendation.pk(chunkItem.id),
						sk: KeyPrefix.songRecommendation.sk(chunkItem.id),
					},
				})),
			),
		),
	);
};
