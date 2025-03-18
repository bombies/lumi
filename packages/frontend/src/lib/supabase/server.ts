import { cookies } from 'next/headers';
import { SupabaseUser } from '@lumi/core/types/auth.types';
import { createServerClient } from '@supabase/ssr';

export const createSupabaseServerClient = async () => {
	const cookieStore = await cookies();
	return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
		cookies: {
			getAll() {
				return cookieStore.getAll();
			},
			setAll(cookiesToSet) {
				try {
					cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
				} catch {
					// The `setAll` method was called from a Server Component.
					// This can be ignored if you have middleware refreshing
					// user sessions.
				}
			},
		},
	});
};

export const getServerSession = async () => {
	const supabase = await createSupabaseServerClient();
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();
	if (error) console.error(error);
	return user as SupabaseUser;
};
