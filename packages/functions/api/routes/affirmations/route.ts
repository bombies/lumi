import {
	createAffirmationDto,
	getReceivedAffirmationsDto,
	sendCustomAffirmationDto,
	updateAffirmationDto,
} from '@lumi/core/affirmations/affirmations.dto';
import {
	createAffirmation,
	deleteAffirmation,
	getAffirmationById,
	getOwnedAffirmationsForUser,
	getReceivedAffirmations,
	getTodaysReceivedAffirmations,
	sendAffirmationToUser,
	updateAffirmation,
} from '@lumi/core/affirmations/affirmations.service';
import { getPartnerForUser } from '@lumi/core/relationships/relationship.service';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { relationshipProcedure, router } from '../../utils/trpc';

export const affirmationsRouter = router({
	getAffirmations: relationshipProcedure.query(({ ctx: { user, relationship } }) => {
		return getOwnedAffirmationsForUser(user.id, relationship);
	}),

	createAffirmation: relationshipProcedure
		.input(
			createAffirmationDto.omit({
				ownerId: true,
				relationshipId: true,
			}),
		)
		.mutation(({ input, ctx: { user, relationship } }) =>
			createAffirmation({ ...input, ownerId: user.id, relationshipId: relationship.id }),
		),

	updateAffirmation: relationshipProcedure
		.input(
			updateAffirmationDto.and(
				z.object({
					id: z.uuid(),
				}),
			),
		)
		.mutation(({ input: { id, ...input }, ctx: { user, relationship } }) =>
			updateAffirmation(user.id, relationship.id, id, input),
		),

	deleteAffirmation: relationshipProcedure
		.input(z.uuid())
		.mutation(({ input, ctx: { user, relationship } }) => deleteAffirmation(user.id, relationship.id, input)),

	getReceivedAffirmations: relationshipProcedure
		.input(getReceivedAffirmationsDto)
		.query(({ input, ctx: { user, relationship } }) => getReceivedAffirmations(user.id, relationship.id, input)),

	getTodaysReceivedAffirmations: relationshipProcedure.query(({ ctx: { user, relationship } }) =>
		getTodaysReceivedAffirmations(user.id, relationship.id),
	),

	sendCustomAffirmation: relationshipProcedure
		.input(sendCustomAffirmationDto)
		.mutation(async ({ input, ctx: { user } }) => {
			const partner = await getPartnerForUser(user.id);
			if (!partner)
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: `You do not have a partner!`,
				});
			return sendAffirmationToUser(partner, input);
		}),
});
