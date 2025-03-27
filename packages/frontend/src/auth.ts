import { spotifyApiScopes } from '@lumi/core/auth/auth.const';
import redis from '@lumi/core/redis/redis';
import { SpotifyProviderDatabaseAccount } from '@lumi/core/types/better-auth.types';
import { sendSignUpEmail } from '@lumi/emails/auth/sign-up-email';
import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { bearer, customSession, jwt, username } from 'better-auth/plugins';
import { Pool } from 'pg';
import { Resource } from 'sst';

import { logger } from './lib/logger';

const db = new Pool({
	user: Resource.AuthDB.username,
	password: Resource.AuthDB.password,
	database: Resource.AuthDB.database,
	host: Resource.AuthDB.host,
	port: Resource.AuthDB.port,
});

export const auth = betterAuth({
	database: db,
	secondaryStorage: {
		get: async key => {
			const value = await redis.get(key);
			return value ? value : null;
		},
		set: async (key, value, ttl) => {
			if (ttl) await redis.set(key, value, 'EX', ttl);
			else await redis.set(key, value);
		},
		delete: async key => {
			await redis.del(key);
		},
	},
	trustedOrigins: process.env.NODE_ENV === 'development' ? ['*'] : undefined,
	account: {
		accountLinking: {
			allowDifferentEmails: true,
			enabled: true,
			allowUnlinkingAll: true,
		},
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60,
		},
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		minPasswordLength: 8,
		autoSignIn: false,
	},
	emailVerification: {
		sendVerificationEmail: async data => {
			try {
				logger.debug('Attempting to send sign up email...');
				const details = await sendSignUpEmail({ email: data.user.email, siteUrl: data.url });
				logger.debug('Sucessfully sent email!', details);
			} catch (e) {
				logger.error('Failed to send sign up email', e);
			}
		},
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		expiresIn: 10 * 60,
	},
	socialProviders: {
		spotify: {
			clientId: Resource.SpotifyClientId.value,
			clientSecret: Resource.SpotifyClientSecret.value,
			scope: spotifyApiScopes,
		},
	},
	plugins: [
		nextCookies(),
		username(),
		bearer(),
		jwt(),
		customSession(async ({ user, session }) => {
			const res = await db.query<SpotifyProviderDatabaseAccount>(
				'SELECT * FROM account WHERE "providerId"=\'spotify\' AND "userId"=$1::text',
				[user.id],
			);
			const spotifyAccount = res.rows[0];
			return {
				user,
				session,
				tokens: {
					spotify: spotifyAccount
						? {
								accessToken: spotifyAccount.accessToken,
								refreshToken: spotifyAccount.refreshToken,
								accessTokenExpiresAt: spotifyAccount.accessTokenExpiresAt,
								refreshTokenExpiresAt: spotifyAccount.refreshTokenExpiresAt,
							}
						: undefined,
				},
			};
		}),
	],
});
