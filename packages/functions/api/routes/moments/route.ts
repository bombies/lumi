import {
	createMomentDetails,
	createMomentMessage,
	createMomentTag,
	createRelationshipMomentTag,
	deleteMomentDetails,
	deleteMomentMessage,
	deleteMomentTag,
	deleteRelationshipMomentTag,
	getMessagesForMoment,
	getMomentDetailsById,
	getMomentMessageById,
	getMomentsByTag,
	getMomentsForRelationship,
	getMomentsForUser,
	getMomentUploadUrl,
	getRelationshipMomentTag,
	getRelationshipMomentTags,
	getTagForMoment,
	getTagsForMoment,
	searchMoments,
	setMomentMessageReaction,
	updateMomentDetails,
} from '@lumi/core/moments/moment.service';
import {
	createMomentDetailsDto,
	createMomentMessageDto,
	createMomentTagDto,
	createRelationshipMomentTagDto,
	deleteMomentTagDto,
	getInfiniteMomentMessagesDto,
	getInfiniteMomentsDto,
	getMomentsByTagDto,
	getMomentUploadUrlDto,
	getRelationshipMomentTagsDto,
	searchMomentsDto,
	setMomentMessageReactionDto,
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
		const moment = await getMomentDetailsById(input, { safeReturn: true });
		if (moment?.relationshipId !== relationship.id)
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
		.input(searchMomentsDto)
		.query(async ({ input, ctx: { relationship } }) => searchMoments(relationship.id, input)),

	updateMomentDetails: relationshipProcedure
		.input(
			updateMomentDetailsDto.and(
				z.object({
					momentId: z.uuid(),
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
				momentId: z.uuid(),
			}),
		)
		.mutation(async ({ input: { momentId }, ctx: { user, relationship } }) => {
			const moment = await getMomentDetailsById(momentId, { safeReturn: true });
			if (moment?.relationshipId !== relationship.id || moment?.userId !== user.id)
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
			const moment = await getMomentDetailsById(input.momentId, { safeReturn: true });
			if (moment?.relationshipId !== relationship.id)
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'You are not authorized to get messages for this moment!',
				});

			return getMessagesForMoment(input);
		}),

	reactToMessage: relationshipProcedure.input(setMomentMessageReactionDto)
		.mutation(async ({ input, ctx: { user } }) => {
			const message = await getMomentMessageById(input.messageId);
			if (message?.senderId === user.id)
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'You are not authorized to react to this message!',
				});

			return setMomentMessageReaction(input);
		}),

	deleteMomentMessage: relationshipProcedure.input(z.string()).mutation(async ({ input, ctx: { user } }) => {
		const message = await getMomentMessageById(input);
		if (message?.senderId !== user.id)
			throw new TRPCError({
				code: 'UNAUTHORIZED',
				message: 'You are not authorized to delete this message!',
			});

		return deleteMomentMessage(input);
	}),

	getRelationshipMomentTags: relationshipProcedure
		.input(getRelationshipMomentTagsDto)
		.query(({ input, ctx: { relationship } }) => getRelationshipMomentTags(relationship.id, input)),

	createRelationshipMomentTag: relationshipProcedure
		.input(createRelationshipMomentTagDto)
		.mutation(({ input, ctx: { relationship } }) => createRelationshipMomentTag(relationship.id, input)),

	deleteRelationshipMomentTag: relationshipProcedure
		.input(z.string())
		.mutation(async ({ input, ctx: { relationship } }) => {
			const momentTag = await getRelationshipMomentTag(relationship.id, input);
			if (momentTag?.relationshipId !== relationship.id)
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'You are not authorized to delete this moment tag!',
				});
			return deleteRelationshipMomentTag(relationship.id, input);
		}),

	getTagsForMoment: relationshipProcedure.input(z.string()).query(async ({ input, ctx: { relationship } }) => {
		const moment = await getMomentDetailsById(input, { safeReturn: true });
		if (moment?.relationshipId !== relationship.id)
			throw new TRPCError({
				code: 'UNAUTHORIZED',
				message: 'You are not authorized to access this moment!',
			});
		return getTagsForMoment(input);
	}),

	getMomentsByTag: relationshipProcedure.input(getMomentsByTagDto).query(async ({ input, ctx: { relationship } }) => {
		return getMomentsByTag(relationship.id, input);
	}),

	createTagForMoment: relationshipProcedure
		.input(createMomentTagDto)
		.mutation(async ({ input, ctx: { user, relationship } }) => {
			const moment = await getMomentDetailsById(input.momentId, { safeReturn: true });
			if (moment?.relationshipId !== relationship.id)
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'You are not authorized to tag this moment!',
				});

			return createMomentTag(user.id, relationship.id, input);
		}),

	deleteTagForMoment: relationshipProcedure
		.input(deleteMomentTagDto)
		.mutation(async ({ input, ctx: { relationship } }) => {
			const momentTag = await getTagForMoment(input.momentId, input.tag);
			if (momentTag?.relationshipId !== relationship.id)
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'You are not authorized to delete this moment tag!',
				});

			return deleteMomentTag(input);
		}),

	getMomentUploadUrl: relationshipProcedure
		.input(getMomentUploadUrlDto)
		.mutation(({ input, ctx: { relationship } }) => getMomentUploadUrl(relationship.id, input)),
});
