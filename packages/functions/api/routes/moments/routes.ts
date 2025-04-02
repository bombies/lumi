import {
	createMomentDetails,
	createMomentMessage,
	deleteMomentDetails,
	deleteMomentMessage,
	getMessagesForMoment,
	getMomentDetailsById,
	getMomentMessageById,
	getMomentUploadUrl,
	getMomentsForRelationship,
	getMomentsForUser,
	searchMomentsByTitle,
	updateMomentDetails,
} from '@lumi/core/moments/moment.service';
import {
	createMomentDetailsDto,
	createMomentMessageDto,
	getInfiniteMomentMessagesDto,
	getInfiniteMomentsDto,
	getMomentUploadUrlDto,
	searchMomentsByTitleDto,
	updateMomentDetailsDto,
} from '@lumi/core/moments/moments.dto';
import { extractPartnerIdFromRelationship } from '@lumi/core/utils/global-utils';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { relationshipProcedure, router } from '../../utils/trpc';

export const momentsRouter = router({
	createMomentDetails: relationshipProcedure
		.input(createMomentDetailsDto)
		.mutation(({ input, ctx: { user, relationship } }) => createMomentDetails(user.id, relationship.id, input)),

	getMomentDetails: relationshipProcedure.input(z.string()).query(async ({ input, ctx: { relationship } }) => {
		const moment = await getMomentDetailsById(input);
		if (moment.relationshipId !== relationship.id)
			throw new TRPCError({
				code: 'UNAUTHORIZED',
				message: 'You are not authorized to access this moment',
			});
		return moment;
	}),

	getMoments: relationshipProcedure
		.input(
			getInfiniteMomentsDto.and(
				z.object({
					userId: z.string().optional(),
				}),
			),
		)
		.query(({ input: { userId, ...input }, ctx: { user, relationship } }) => {
			if (!userId) return getMomentsForRelationship(relationship.id, input);
			else {
				const partnerId = extractPartnerIdFromRelationship(user.id, relationship);
				if (userId !== partnerId && userId !== user.id)
					throw new TRPCError({
						code: 'UNAUTHORIZED',
						message: 'You are not authorized to access the moments for this user!',
					});
				return getMomentsForUser(userId, input);
			}
		}),

	searchMoments: relationshipProcedure
		.input(searchMomentsByTitleDto)
		.query(async ({ input, ctx: { relationship } }) => searchMomentsByTitle(relationship.id, input)),

	updateMomentDetails: relationshipProcedure
		.input(
			updateMomentDetailsDto.and(
				z.object({
					momentId: z.string().uuid(),
				}),
			),
		)
		.mutation(async ({ input: { momentId, ...input }, ctx: { user, relationship } }) => {
			const moment = await getMomentDetailsById(momentId);

			if (moment.relationshipId !== relationship.id || moment.userId !== user.id)
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'You are not authorized to update this moment!',
				});

			return updateMomentDetails(momentId, input);
		}),

	deleteMomentDetails: relationshipProcedure
		.input(
			z.object({
				momentId: z.string().uuid(),
			}),
		)
		.mutation(async ({ input: { momentId }, ctx: { user, relationship } }) => {
			const moment = await getMomentDetailsById(momentId);

			if (moment.relationshipId !== relationship.id || moment.userId !== user.id)
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'You are not authorized to delete this moment!',
				});

			return deleteMomentDetails(momentId);
		}),

	createMomentMessage: relationshipProcedure
		.input(createMomentMessageDto)
		.mutation(async ({ input, ctx: { user, relationship } }) => {
			const moment = await getMomentDetailsById(input.momentId);

			if (moment.relationshipId !== relationship.id)
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'You are not authorized to send a message for this moment!',
				});

			return createMomentMessage(user.id, input);
		}),

	getMessagesForMoment: relationshipProcedure
		.input(getInfiniteMomentMessagesDto)
		.query(async ({ input, ctx: { relationship } }) => {
			const moment = await getMomentDetailsById(input.momentId);

			if (moment.relationshipId !== relationship.id)
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'You are not authorized to get messages for this moment!',
				});

			return getMessagesForMoment(input);
		}),

	deleteMomentMessage: relationshipProcedure.input(z.string()).mutation(async ({ input, ctx: { user } }) => {
		const message = await getMomentMessageById(input);

		if (!message)
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Moment message not found!',
			});

		if (message.senderId !== user.id)
			throw new TRPCError({
				code: 'UNAUTHORIZED',
				message: 'You are not authorized to delete this message!',
			});

		return deleteMomentMessage(input);
	}),

	getMomentUploadUrl: relationshipProcedure
		.input(getMomentUploadUrlDto)
		.mutation(({ input, ctx: { relationship } }) => getMomentUploadUrl(relationship.id, input)),
});
