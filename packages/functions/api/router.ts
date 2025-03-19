import { affirmationsRouter } from './routes/affirmations/route';
import { momentsRouter } from './routes/moments/routes';
import { relationshipsRouter } from './routes/relationships/route';
import { usersRouter } from './routes/users/route';
import { router } from './utils/trpc';

export const appRouter = router({
	users: usersRouter,
	relationships: relationshipsRouter,
	affirmations: affirmationsRouter,
	moments: momentsRouter,
});
