import type { auth as Auth } from '@/auth';
import { customSessionClient, jwtClient, usernameClient } from 'better-auth/client/plugins';

import { createAuthClient } from 'better-auth/react';

export const auth = createAuthClient({
	plugins: [usernameClient(), jwtClient(), customSessionClient<typeof Auth>()],
});
