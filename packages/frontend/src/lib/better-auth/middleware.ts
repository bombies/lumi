import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

const AUTH_WALLED_MATHCERS: string[] = [
	'/auth/verify',
	'/home',
	'/moments',
	'/affirmations',
	'/music-sharing',
	'/settings',
	'/join',
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
