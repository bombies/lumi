import { redirect } from 'next/navigation';
import { type NextRequest } from 'next/server';
import { type EmailOtpType } from '@supabase/supabase-js';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const token_hash = searchParams.get('token_hash');
	const type = searchParams.get('type') as EmailOtpType | null;
	const next = searchParams.get('next') ?? '/';
	const email = searchParams.get('email');

	if (token_hash && type) {
		const supabase = await createSupabaseServerClient();

		const { error } = await supabase.auth.verifyOtp({
			type,
			token_hash,
		});
		if (!error) {
			// redirect user to specified redirect URL or root of app
			redirect(next);
		} else {
			if (error.code === 'otp_expired' && email) {
				await supabase.auth.resend({
					type: 'signup',
					email,
				});
				redirect('/auth/login?error=ExpiredToken');
			}
		}
	}

	// redirect the user to an error page with some instructions
	redirect('/auth/login?error=InvalidToken');
}
