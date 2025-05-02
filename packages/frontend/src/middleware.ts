import type { NextRequest } from 'next/server';

import { updateSession } from './lib/better-auth/middleware';

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

const middleware: Middleware = async (request) => {
	return await updateSession(request);
};

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
		'/((?!api|_next/static|_next/image|images|favicon.ico|sitemap.xml|robots.txt|opengraph-image|twitter-image|_not-found|apple-icon|auth|favicon.svg|favicon-|web-app-manifest-|notification-worker.js|apple-touch-icon|apple-icon|apple-splash|MediaInfoModule.wasm).*)',
	],
};
