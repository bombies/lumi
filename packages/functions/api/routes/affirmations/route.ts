import {
	createAffirmationDto,
	getReceivedAffirmationsDto,
	updateAffirmationDto,
} from '@lumi/core/affirmations/affirmations.dto';
import {
	createAffirmation,
	deleteAffirmation,
	getAffirmationById,
	getOwnedAffirmationsForUser,
	getReceivedAffirmations,
	updateAffirmation,
} from '@lumi/core/affirmations/affirmations.service';
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
					id: z.string().uuid(),
				}),
			),
		)
		.mutation(({ input: { id, ...input }, ctx: { user, relationship } }) =>
			updateAffirmation(user.id, relationship.id, id, input),
		),

	deleteAffirmation: relationshipProcedure
		.input(z.string().uuid())
		.mutation(({ input, ctx: { user, relationship } }) => deleteAffirmation(user.id, relationship.id, input)),

	getReceivedAffirmations: relationshipProcedure
		.input(getReceivedAffirmationsDto)
		.query(({ input, ctx: { user, relationship } }) => getReceivedAffirmations(user.id, relationship.id, input)),
});
