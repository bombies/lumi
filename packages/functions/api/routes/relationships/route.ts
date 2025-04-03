import { getRelationshipRequestsForUserDto } from '@lumi/core/relationships/relationship.dto';
import {
	acceptRelationshipRequest,
	deleteRelationshipRequestById,
	deleteUserRelationship,
	getReceivedRelationshipRequestsForUser,
	getSentRelationshipRequestsForUser,
	sendRelationshipRequest,
} from '@lumi/core/relationships/relationship.service';
import { createInfiniteDataDto } from '@lumi/core/types/infinite-data.dto';
import { getUserById } from '@lumi/core/users/users.service';
import { z } from 'zod';

import { protectedProcedure, relationshipProcedure, router } from '../../utils/trpc';

export const relationshipsRouter = router({
	sendRelationshipRequest: protectedProcedure.input(z.string()).mutation(({ input, ctx: { user } }) => {
		return sendRelationshipRequest(user.id, input);
	}),

	acceptRelationshipRequest: protectedProcedure
		.input(z.string().uuid('Invalid relationship request ID!'))
		.mutation(({ input, ctx: { user } }) => {
			return acceptRelationshipRequest(user.id, input);
		}),

	removeRelationshipRequest: protectedProcedure
		.input(z.string().uuid('Invalid relationship request ID!'))
		.mutation(({ input, ctx: { user } }) => {
			return deleteRelationshipRequestById(user.id, input);
		}),

	getSentRelationshipRequests: protectedProcedure
		.input(
			createInfiniteDataDto({
				defaultLimit: 50,
			}),
		)
		.query(({ input, ctx: { user } }) =>
			getSentRelationshipRequestsForUser({
				...input,
				userId: user.id,
			}),
		),

	getReceivedRelationshipRequests: protectedProcedure
		.input(
			createInfiniteDataDto({
				defaultLimit: 50,
			}),
		)
		.query(({ input, ctx: { user } }) =>
			getReceivedRelationshipRequestsForUser({
				...input,
				userId: user.id,
			}),
		),

	getRelationship: relationshipProcedure.query(({ ctx }) => ctx.relationship),

	getRelationshipPartner: relationshipProcedure.query(async ({ ctx: { user, relationship } }) => {
		const partnerId = relationship.partner1 === user.id ? relationship.partner2 : relationship.partner1;
		const partner = await getUserById(partnerId);
		return partner;
	}),

	leaveRelationship: relationshipProcedure.mutation(({ ctx: { user } }) => deleteUserRelationship(user.id)),
});
