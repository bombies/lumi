import { DynamoDBAdapter } from '@auth/dynamodb-adapter';
import { verifyUserPassword } from '@lumi/core/users/users.service';
import { dynamo } from '@lumi/core/utils/dynamo/dynamo.service';
import NextAuth, { DefaultSession, NextAuthResult, User } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import Credentials from 'next-auth/providers/credentials';

import authConfig from '@/auth.config';
import { sign } from '@/lib/jwt';

const JWT_EXPIRATION = 60 * 60 * 24 * 7; // 7 days

declare module 'next-auth' {
	interface Session extends DefaultSession {
		backendToken: string;
		user: User;
	}

	interface User {
		username?: string;
		firstName?: string;
		lastName?: string;
		verified?: boolean;
		relationshipId?: string;
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		user: User;
		backendToken: string;
	}
}

const { providers: authProviders, ...config } = authConfig;

const nextAuth = NextAuth({
	adapter: DynamoDBAdapter(dynamo, {
		tableName: process.env.TABLE_NAME,
		partitionKey: 'pk',
		sortKey: 'sk',
		indexName: 'GSI1',
		indexPartitionKey: 'gsi1pk',
		indexSortKey: 'gsi1sk',
	}),
	providers: [
		// Google({
		// 	clientId: process.env.AUTH_GOOGLE_ID!,
		// 	clientSecret: process.env.AUTH_GOOGLE_SECRET!,
		// 	async profile(profile: GoogleProfile) {
		// 		return updateProfileOrCreateUser({
		// 			firstName: profile.given_name,
		// 			lastName: profile.family_name,
		// 			email: profile.email,
		// 			image: profile.picture,
		// 		});
		// 	},
		// }),
		Credentials({
			credentials: {
				username: { label: 'Username/Email', type: 'text', required: true },
				password: { label: 'Password', type: 'password', required: true },
			},
			authorize: async credentials => {
				if (!credentials) throw new Error('Missing credentials!');

				const verificationResult = await verifyUserPassword(
					credentials.username as string,
					credentials.password as string,
				);

				if (!verificationResult) throw new Error('Invalid credentials!');

				const { id, username, firstName, lastName, email, verified, relationshipId } = verificationResult;
				return { id, username, firstName, lastName, email, verified, relationshipId };
			},
		}),
		...authProviders,
	],
	callbacks: {
		async jwt({ token, user, trigger, session }) {
			// Check if the token is being created on signin
			if (user) {
				const backendToken = await sign(user, {
					expirationTime: token.exp ?? '1 week',
				});

				token.user = user;
				token.backendToken = backendToken;
			}

			if (trigger === 'update' && session) {
				const backendToken = await sign(session.user, {
					expirationTime: '1 week',
				});

				token.user = session.user;
				token.backendToken = backendToken;
			}

			return token;
		},
		async session({ session, token }) {
			return {
				...session,
				backendToken: token.backendToken,
				user: token.user,
			};
		},
	},
	session: {
		strategy: 'jwt',
		maxAge: 60 * 60 * 2, // 2 hours,
	},
	jwt: { maxAge: JWT_EXPIRATION },
	...config,
});

export const handlers: NextAuthResult['handlers'] = nextAuth.handlers;
export const signIn: NextAuthResult['signIn'] = nextAuth.signIn;
export const signOut: NextAuthResult['signOut'] = nextAuth.signOut;
export const auth: NextAuthResult['auth'] = nextAuth.auth;
export const update: NextAuthResult['unstable_update'] = nextAuth.unstable_update;
