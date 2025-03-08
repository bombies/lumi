import { authRouter } from './routes/auth/route';
import { router } from './utils/trpc';

export const appRouter = router({
	auth: authRouter,
});
