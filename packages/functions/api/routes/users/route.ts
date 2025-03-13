import { getUsersByEmailDto, getUsersByUsernameDto, updateUserDto } from '@lumi/core/users/users.dto';
import { getUserById, getUsersByEmail, getUsersByUsername, updateUser } from '@lumi/core/users/users.service';

import { protectedProcedure, publicProcedure, router } from '../../utils/trpc';

export const usersRouter = router({
	getUsersByUsername: publicProcedure.input(getUsersByUsernameDto).query(({ input }) => getUsersByUsername(input)),

	getUsersByEmail: publicProcedure.input(getUsersByEmailDto).query(({ input }) => getUsersByEmail(input)),

	updateSelf: protectedProcedure
		.input(updateUserDto)
		.mutation(({ input, ctx: { user } }) => updateUser(user.id, input)),

	getSelf: protectedProcedure.query(({ ctx: { user } }) => getUserById(user.id)),
	getSelfOnDemand: protectedProcedure.mutation(({ ctx: { user } }) => getUserById(user.id)),
});
