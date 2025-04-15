import { customSessionClient, jwtClient, usernameClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import type { auth as Auth } from '@/auth';

export const auth = createAuthClient({
	plugins: [usernameClient(), jwtClient(), customSessionClient<typeof Auth>()],
});
