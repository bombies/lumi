import {
	getUserAvatarUploadUrlDto,
	getUsersByEmailDto,
	getUsersByUsernameDto,
	updateUserDto,
} from '@lumi/core/users/users.dto';
import {
	getUserAvatarUploadUrl,
	getUserById,
	getUsersByEmail,
	getUsersByUsername,
	updateUser,
} from '@lumi/core/users/users.service';
import { z } from 'zod';

import { protectedProcedure, publicProcedure, router } from '../../utils/trpc';

export const usersRouter = router({
	getUsersByUsername: publicProcedure.input(getUsersByUsernameDto).query(({ input }) => getUsersByUsername(input)),

	getUsersByEmail: publicProcedure.input(getUsersByEmailDto).query(({ input }) => getUsersByEmail(input)),

	updateSelf: protectedProcedure
		.input(updateUserDto)
		.mutation(({ input, ctx: { user } }) => updateUser(user.id, input)),

	getSelf: protectedProcedure.query(({ ctx: { user } }) => getUserById(user.id)),

	getSelfOnDemand: protectedProcedure.mutation(({ ctx: { user } }) => getUserById(user.id)),

	getUserAvatarUploadUrl: protectedProcedure.input(getUserAvatarUploadUrlDto).mutation(({ ctx: { user }, input }) =>
		getUserAvatarUploadUrl({
			userId: user.id,
			...input,
		}),
	),

	getUserByIdSafe: protectedProcedure.input(z.string()).query(({ input }) =>
		getUserById(input, {
			projections: ['id', 'firstName', 'lastName', 'avatarUrl', 'avatarKey', 'username'],
		}),
	),
});
