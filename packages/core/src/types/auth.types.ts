import { User } from '@supabase/supabase-js';

export type SupabaseUser = User & {
	user_metadata: SupabaseUserMetaData;
};

export type SupabaseAccessToken = Pick<
	SupabaseUser,
	'aud' | 'email' | 'phone' | 'app_metadata' | 'user_metadata' | 'role' | 'is_anonymous'
> & {
	iss: string;
	sub: string;
	exp: number;
	iat: number;
	aal: string;
	amr: { method: string; timestamp: number }[];
	session_id: string;
};

export type SupabaseUserMetaData = {
	email: string;
} & CustomSuperbaseUserMetaData;

export type CustomSuperbaseUserMetaData = {
	username: string;
};
