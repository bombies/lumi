'use server';

import { cookies } from 'next/headers';
import { SupabaseUser, SupabaseUserMetaData } from '@lumi/core/types/auth.types';
import { createServerClient } from '@supabase/ssr';
import { AuthSessionMissingError } from '@supabase/supabase-js';

import { logger } from '../logger';

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
	if (error && !(error instanceof AuthSessionMissingError)) {
		logger.warn('Supbase auth error: ', error);
		return undefined;
	}

	const ignoredKeys = new Set<string>(['username', 'email'] satisfies (keyof SupabaseUserMetaData)[]);
	if (
		user &&
		Object.keys(user.user_metadata).length &&
		Object.keys(user.user_metadata).some(key => !ignoredKeys.has(key))
	) {
		await supabase.auth.updateUser({
			data: Object.keys(user.user_metadata).reduce(
				(acc, cur) => {
					if (ignoredKeys.has(cur)) acc[cur] = user.user_metadata[cur];
					else acc[cur] = null;
					return acc;
				},
				{} as Record<string, any>,
			),
		});
	}

	return user as SupabaseUser;
};
