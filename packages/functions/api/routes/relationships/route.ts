import { getRelationshipRequestsForUserDto } from '@lumi/core/relationships/relationship.dto';
import {
	acceptRelationshipRequest,
	deleteRelationshipRequestById,
	getReceivedRelationshipRequestsForUser,
	getSentRelationshipRequestsForUser,
	sendRelationshipRequest,
} from '@lumi/core/relationships/relationship.service';
import { z } from 'zod';

import { protectedProcedure, router } from '../../utils/trpc';

export const relationshipsRouter = router({
	sendRelationshipRequest: protectedProcedure
		.input(z.string().uuid('Invalid user ID!'))
		.mutation(({ input, ctx: { user } }) => {
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
		.input(getRelationshipRequestsForUserDto)
		.query(({ input, ctx: { user } }) =>
			getSentRelationshipRequestsForUser({
				...input,
				userId: user.id,
			}),
		),

	getReceivedRelationshipRequests: protectedProcedure
		.input(getRelationshipRequestsForUserDto)
		.query(({ input, ctx: { user } }) =>
			getReceivedRelationshipRequestsForUser({
				...input,
				userId: user.id,
			}),
		),
});
