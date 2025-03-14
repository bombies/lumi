import type { NextAuthConfig } from 'next-auth';

// Edge Compatible Config Values

export default {
	providers: [],
	pages: {
		signIn: '/auth/login',
		error: '/auth/login',
		newUser: '/home',
	},
	secret: process.env.AUTH_SECRET,
	debug: process.env.NODE_ENV === 'development',
} satisfies NextAuthConfig;
