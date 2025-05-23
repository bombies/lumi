import { affirmationsRouter } from './routes/affirmations/route';
import { calendarRouter } from './routes/calendar/route';
import { momentsRouter } from './routes/moments/route';
import { musicSharingRouter } from './routes/music-sharing/route';
import { notificationsRouter } from './routes/notifications/route';
import { relationshipsRouter } from './routes/relationships/route';
import { usersRouter } from './routes/users/route';
import { router } from './utils/trpc';

export const appRouter = router({
	users: usersRouter,
	relationships: relationshipsRouter,
	affirmations: affirmationsRouter,
	moments: momentsRouter,
	musicSharing: musicSharingRouter,
	notifications: notificationsRouter,
	calendar: calendarRouter,
});
