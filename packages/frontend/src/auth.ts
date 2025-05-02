import type { SpotifyProviderDatabaseAccount } from '@lumi/core/auth/better-auth.types';
import { spotifyApiScopes } from '@lumi/core/auth/auth.const';
import redis from '@lumi/core/redis/redis';
import { sendAccountDeletionEmail } from '@lumi/emails/auth/delete-account-email';
import { sendSignUpEmail } from '@lumi/emails/auth/sign-up-email';
import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { bearer, customSession, jwt, username } from 'better-auth/plugins';
import { Pool } from 'pg';
import { Resource } from 'sst';

import { logger } from './lib/logger';

export const db = new Pool(
	Resource.PostgresConnectionString.value.length
		? {
				connectionString: Resource.PostgresConnectionString.value,
			}
		: {
				user: Resource.PostgresUsername.value,
				password: Resource.PostgresPassword.value,
				database: Resource.PostgresDatabase.value,
				host: Resource.PostgresHost.value,
				port: Number.parseInt(Resource.PostgresPort.value),
			},
);

export const auth = betterAuth({
	database: db,
	secondaryStorage: {
		get: async (key) => {
			const value = await redis.get(key);
			return value || null;
		},
		set: async (key, value, ttl) => {
			if (ttl) await redis.set(key, value, 'EX', ttl);
			else await redis.set(key, value);
		},
		delete: async (key) => {
			await redis.del(key);
		},
	},
	trustedOrigins: process.env.NODE_ENV === 'development' ? ['*'] : undefined,
	user: {
		deleteUser: {
			enabled: true,
			async sendDeleteAccountVerification({ user, url }) {
				try {
					logger.debug('Attempting to send account deletion email...');
					const details = await sendAccountDeletionEmail({ email: user.email, siteUrl: url });
					logger.debug('Sucessfully sent email!', details);
				} catch (e) {
					logger.error('Failed to send account deletion email', e);
				}
			},
		},
	},
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
		requireEmailVerification: false,
		minPasswordLength: 8,
		autoSignIn: true,
	},
	emailVerification: {
		sendVerificationEmail: async (data) => {
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
		expiresIn: 60 * 60,
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
