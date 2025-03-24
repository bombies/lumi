import { createBrowserClient } from '@supabase/ssr';

import { useLocalStorage } from '../hooks/useLocalStorage';

export const useSupabaseBrowserClient = () => {
	const storage = useLocalStorage();
	const browserClient = createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			auth: {
				flowType: 'implicit',
			},
		},
	);

	browserClient.auth.onAuthStateChange((event, session) => {
		if (session && session.provider_token) {
			storage?.setItem('oauth_provider_token', session.provider_token);
		}

		if (session && session.provider_refresh_token) {
			storage?.setItem('oauth_provider_refresh_token', session.provider_refresh_token);
		}

		if (event === 'SIGNED_OUT') {
			storage?.removeItem('oauth_provider_token');
			storage?.removeItem('oauth_provider_refresh_token');
		}
	});

	return browserClient;
};
