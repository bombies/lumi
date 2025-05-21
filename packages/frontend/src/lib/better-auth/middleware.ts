import type { NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import { NextResponse } from 'next/server';

const AUTH_WALLED_MATHCERS: string[] = [
	'/auth/verify',
	'/home',
	'/moments',
	'/affirmations',
	'/music-sharing',
	'/settings',
	'/join',
	'/calendar',
];

export async function updateSession(request: NextRequest) {
	const sessionCookie = getSessionCookie(request);
	const pathName = request.nextUrl.pathname;
	if (!sessionCookie && AUTH_WALLED_MATHCERS.some(matcher => new RegExp(matcher).test(`^${pathName}`))) {
		// no user, potentially respond by redirecting the user to the login page
		const url = request.nextUrl.clone();
		url.pathname = '/auth/login';
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}
