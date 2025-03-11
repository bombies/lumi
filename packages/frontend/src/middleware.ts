import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

import { auth } from './auth';

const AUTH_WALLED_MATHCERS: string[] = [
	'/auth/verify',
	'/home',
	'/moments',
	'/affirmations',
	'/music-sharing',
	'/settings',
	'/join',
];

type Middleware = (
	/**
	 * Incoming request object.
	 */
	req: NextRequest,
	/**
	 * Context properties on the request (including the parameters if this was a
	 * dynamic route).
	 */
	ctx: { params?: Record<string, string | string[]> },
) => void | Response | Promise<void | Response>;

const middleware: Middleware = auth(async request => {
	const token = await getToken({
		req: request,
		secret: process.env.AUTH_SECRET,
		cookieName: '__Secure-authjs.session-token',
	});

	// console.log('[Middleware] ', request.nextUrl.pathname, token);

	// Use the regex matcher to check if the current path is a walled route
	const pathName = request.nextUrl.pathname;
	if (AUTH_WALLED_MATHCERS.some(matcher => new RegExp(matcher).test(`^${pathName}`)) && !token)
		return NextResponse.redirect(new URL('/auth/login', request.url));

	// Check if a user is verified
	if (token && !token.user.verified && request.nextUrl.pathname !== '/auth/verify')
		return NextResponse.redirect(new URL('/auth/verify', request.url));

	const headers = new Headers(request.headers);
	headers.set('x-current-path', request.nextUrl.pathname);

	return NextResponse.next({ headers });
});

export default middleware;

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico, sitemap.xml, robots.txt (metadata files)
		 */
		'/((?!api|_next/static|_next/image|images|favicon.ico|sitemap.xml|robots.txt|opengraph-image|twitter-image|_not-found|apple-icon|auth|favicon.svg|favicon-|web-app-manifest-|notification-worker.js|apple-touch-icon).*)',
	],
};
