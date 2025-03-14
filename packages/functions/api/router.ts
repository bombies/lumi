import { affirmationsRouter } from './routes/affirmations/route';
import { authRouter } from './routes/auth/route';
import { relationshipsRouter } from './routes/relationships/route';
import { usersRouter } from './routes/users/route';
import { router } from './utils/trpc';

export const appRouter = router({
	auth: authRouter,
	users: usersRouter,
	relationships: relationshipsRouter,
	affirmations: affirmationsRouter,
});
