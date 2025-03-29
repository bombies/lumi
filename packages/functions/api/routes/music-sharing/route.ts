import {
	createSongRecommendationDto,
	getSongRecommendationsDto,
	updateSongRecommendationDto,
} from '@lumi/core/song-recommendations/song-recommendations.dto';
import {
	createSongRecommendation,
	deleteSongRecommendation,
	getSongRecommendationById,
	getSongRecommendations,
	getSongRecommendationsByRelationshipId,
	updateSongRecommendation,
} from '@lumi/core/song-recommendations/song-recommendations.service';
import { extractPartnerIdFromRelationship } from '@lumi/core/utils/global-utils';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { relationshipProcedure, router } from '../../utils/trpc';

export const musicSharingRouter = router({
	createSongRecommendation: relationshipProcedure
		.input(createSongRecommendationDto)
		.mutation(({ input, ctx: { user, relationship } }) =>
			createSongRecommendation(user.id, relationship.id, input),
		),

	getSongRecommendations: relationshipProcedure
		.input(getSongRecommendationsDto)
		.query(({ input, ctx: { user, relationship } }) =>
			getSongRecommendations(extractPartnerIdFromRelationship(user.id, relationship), relationship.id, input),
		),

	getSelfSongRecommendations: relationshipProcedure
		.input(getSongRecommendationsDto)
		.query(({ input, ctx: { user, relationship } }) => getSongRecommendations(user.id, relationship.id, input)),

	getSongRecommendationsForRelationship: relationshipProcedure
		.input(getSongRecommendationsDto)
		.query(({ input, ctx: { relationship } }) => getSongRecommendationsByRelationshipId(relationship.id, input)),

	updateSongRecommendation: relationshipProcedure
		.input(
			updateSongRecommendationDto.and(
				z.object({
					recId: z.string().uuid(),
				}),
			),
		)
		.mutation(async ({ input: { recId, ...dto }, ctx: { relationship, user } }) => {
			const rec = await getSongRecommendationById(recId);
			if (!rec)
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'There is no song recommendation with that ID!',
				});

			if (rec.relationshipId !== relationship.id || user.id === rec.recommenderId)
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'You cannot update this song recommendation!',
				});

			return updateSongRecommendation(recId, dto);
		}),

	deleteSongRecommendation: relationshipProcedure
		.input(z.string())
		.mutation(async ({ input: recId, ctx: { relationship, user } }) => {
			const rec = await getSongRecommendationById(recId);
			if (!rec)
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'There is no song recommendation with that ID!',
				});

			if (rec.relationshipId !== relationship.id || user.id !== rec.recommenderId)
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'You cannot delete this song recommendation!',
				});
			return deleteSongRecommendation(recId);
		}),
});
