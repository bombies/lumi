import { TRPCError } from '@trpc/server';

import { KeyPrefix } from '../types/dynamo.types';
import { getInfiniteData } from '../types/infinite-data.dto';
import { DatabaseSongRecommendation, SongRecommendation } from '../types/song-recommendation.types';
import { dynamo, getDynamicUpdateStatements } from '../utils/dynamo/dynamo.service';
import { getUUID } from '../utils/utils';
import {
	CreateSongRecommendationDto,
	GetSongRecommendationsDto,
	UpdateSongRecommendationDto,
} from './song-recommendations.dto';

export const getSongRecommendationByTrackIdForUser = async (userId: string, trackId: string) => {
	const res = await dynamo.query({
		TableName: process.env.TABLE_NAME,
		IndexName: 'GSI2',
		KeyConditionExpression: '#pk = :pk and #sk = :sk',
		ExpressionAttributeNames: {
			'#pk': 'gsi2pk',
			'#sk': 'gsi2sk',
		},
		ExpressionAttributeValues: {
			':pk': `${KeyPrefix.SONG_RECOMMENDATION}${userId}`,
			':sk': `${KeyPrefix.SONG_RECOMMENDATION}${trackId}`,
		},
	});
	return res.Items?.[0] as DatabaseSongRecommendation | undefined;
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
	const res = await dynamo.put({
		TableName: process.env.TABLE_NAME,
		Item: {
			pk: `${KeyPrefix.SONG_RECOMMENDATION}${recId}`,
			sk: `${KeyPrefix.SONG_RECOMMENDATION}${recId}`,
			gsi1pk: `${KeyPrefix.SONG_RECOMMENDATION}${relationshipId}`,
			gsi1sk: `${KeyPrefix.SONG_RECOMMENDATION}${recommenderId}#unlistened#${createdAt}`,
			gsi2pk: `${KeyPrefix.SONG_RECOMMENDATION}${recommenderId}`,
			gsi2sk: `${KeyPrefix.SONG_RECOMMENDATION}${dto.id}`,
			...songRec,
		} satisfies DatabaseSongRecommendation,
	});

	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Could not create song recommendation!',
		});

	return songRec;
};

export const getSongRecommendations = async (
	partnerId: string,
	relationshipId: string,
	{ limit, cursor, order, ...dto }: GetSongRecommendationsDto,
) => {
	const res = await dynamo.query({
		TableName: process.env.TABLE_NAME,
		IndexName: 'GSI1',
		KeyConditionExpression: '#pk = :pk and begins_with(#sk, :sk)',
		ExpressionAttributeNames: {
			'#pk': 'gsi1pk',
			'#sk': 'gsi1sk',
		},
		ExpressionAttributeValues: {
			':pk': `${KeyPrefix.SONG_RECOMMENDATION}${relationshipId}`,
			':sk': `${KeyPrefix.SONG_RECOMMENDATION}${partnerId}${dto.filter ? `#${dto.filter}` : ''}`,
		},
		Limit: limit,
		ExclusiveStartKey: cursor,
		ScanIndexForward: order === 'asc',
	});

	return getInfiniteData<SongRecommendation>(res);
};

export const getSongRecommendationById = async (recId: string) => {
	const res = await dynamo.get({
		TableName: process.env.TABLE_NAME,
		Key: {
			pk: `${KeyPrefix.SONG_RECOMMENDATION}${recId}`,
			sk: `${KeyPrefix.SONG_RECOMMENDATION}${recId}`,
		},
	});
	return res.Item as SongRecommendation | undefined;
};

export const updateSongRecommendation = async (recId: string, dto: UpdateSongRecommendationDto) => {
	const existingRec = await getSongRecommendationById(recId);
	if (!existingRec)
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'Song recommendation not found!',
		});

	const { updateStatements, expressionAttributeNames, expressionAttributeValues } = getDynamicUpdateStatements({
		...dto,
		gsi1sk:
			dto.listened !== undefined
				? `${KeyPrefix.SONG_RECOMMENDATION}${existingRec.recommenderId}#${dto.listened ? 'listened' : 'unlistened'}#${existingRec.createdAt}`
				: undefined,
	});

	const res = await dynamo.update({
		TableName: process.env.TABLE_NAME,
		Key: {
			pk: `${KeyPrefix.SONG_RECOMMENDATION}${recId}`,
			sk: `${KeyPrefix.SONG_RECOMMENDATION}${recId}`,
		},
		UpdateExpression: updateStatements,
		ExpressionAttributeNames: expressionAttributeNames,
		ExpressionAttributeValues: expressionAttributeValues,
		ReturnValues: 'ALL_NEW',
	});

	return res.Attributes as SongRecommendation;
};

export const deleteSongRecommendation = async (recId: string) => {
	const existingRec = await getSongRecommendationById(recId);
	if (!existingRec)
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'Song recommendation not found!',
		});

	await dynamo.delete({
		TableName: process.env.TABLE_NAME,
		Key: {
			pk: `${KeyPrefix.SONG_RECOMMENDATION}${recId}`,
			sk: `${KeyPrefix.SONG_RECOMMENDATION}${recId}`,
		},
	});

	return existingRec;
};
