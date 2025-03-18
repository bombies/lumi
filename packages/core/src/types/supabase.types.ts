export type SupabaseEmailHookPayload = {
	user: {
		id: string;
		aud: 'authenticated';
		role: 'anon' | 'authenticated';
		email: string;
		phone: string;
		app_metadata: {
			provider?: 'email';
			providers?: ['email'];
			[k: string]: unknown;
		};
		user_metadata: {
			email?: string;
			email_verified?: boolean;
			phone_verified?: boolean;
			sub?: string;
			[k: string]: unknown;
		};
		identities: {
			identity_id: string;
			id: string;
			user_id: string;
			identity_data: {
				email?: string;
				email_verified?: boolean;
				phone_verified?: boolean;
				sub?: string;
				[k: string]: unknown;
			};
			provider: 'email';
			last_sign_in_at: string;
			created_at: string;
			updated_at: string;
			email: string;
			[k: string]: unknown;
		}[];
		created_at: string;
		updated_at: string;
		is_anonymous: boolean;
		[k: string]: unknown;
	};
	email_data: {
		token: string;
		token_hash: string;
		redirect_to: string;
		email_action_type: 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email';
		site_url: string;
		token_new: string;
		token_hash_new: string;
		[k: string]: unknown;
	};
	[k: string]: unknown;
};
