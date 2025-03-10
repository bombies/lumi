import { getUsersByEmailDto, getUsersByUsernameDto } from '@lumi/core/users/users.dto';
import { getUsersByEmail, getUsersByUsername } from '@lumi/core/users/users.service';

import { publicProcedure, router } from '../../utils/trpc';

export const usersRouter = router({
	getUsersByUsername: publicProcedure.input(getUsersByUsernameDto).query(({ input }) => getUsersByUsername(input)),

	getUsersByEmail: publicProcedure.input(getUsersByEmailDto).query(({ input }) => getUsersByEmail(input)),
});
