import { TRPCError } from '@trpc/server';
import type { User as BetterAuthUser } from 'better-auth';
import { JWTPayload, SignJWT, createRemoteJWKSet, jwtVerify } from 'jose';
import { JWSInvalid, JWTExpired } from 'jose/errors';

import { createUser, getUserByEmail } from '../users/users.service';
import { RegisterUserDto } from './auth.dto';

export const registerUser = async (dto: RegisterUserDto) => {
	let existingUser = await getUserByEmail(dto.email);
	if (existingUser)
		throw new TRPCError({
			message: 'User with this email already exists',
			code: 'BAD_REQUEST',
		});

	existingUser = await getUserByEmail(dto.username);
	if (existingUser)
		throw new TRPCError({
			message: 'User with this username already exists',
			code: 'BAD_REQUEST',
		});

	return createUser(dto);
};

type SignOptions = {
	/**
	 * Set the "exp" (Expiration Time) Claim.
	 *
	 * - If a `number` is passed as an argument it is used as the claim directly.
	 * - If a `Date` instance is passed as an argument it is converted to unix timestamp and used as the
	 *   claim.
	 * - If a `string` is passed as an argument it is resolved to a time span, and then added to the
	 *   current unix timestamp and used as the claim.
	 *
	 * Format used for time span should be a number followed by a unit, such as "5 minutes" or "1
	 * day".
	 *
	 * Valid units are: "sec", "secs", "second", "seconds", "s", "minute", "minutes", "min", "mins",
	 * "m", "hour", "hours", "hr", "hrs", "h", "day", "days", "d", "week", "weeks", "w", "year",
	 * "years", "yr", "yrs", and "y". It is not possible to specify months. 365.25 days is used as an
	 * alias for a year.
	 *
	 * If the string is suffixed with "ago", or prefixed with a "-", the resulting time span gets
	 * subtracted from the current unix timestamp. A "from now" suffix can also be used for
	 * readability when adding to the current unix timestamp.
	 *
	 */
	expirationTime?: number | string | Date;
	iat: number | string | Date;
};

export function encodeJwtToken(payload: any, opts: SignOptions) {
	const jwtbuilder = new SignJWT({ ...payload }).setProtectedHeader({
		alg: 'HS256',
		typ: 'JWT',
	});

	if (opts?.expirationTime) jwtbuilder.setExpirationTime(opts.expirationTime);

	const token = jwtbuilder
		.setIssuedAt(opts.iat)
		.setNotBefore(opts.iat)
		.sign(new TextEncoder().encode(process.env.AUTH_SECRET));

	return token;
}

export async function verify<T extends object = any>(
	token: string,
	secret: string,
	args?: {
		acceptExpired?: boolean;
	},
): Promise<T> {
	try {
		const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
		return payload as T;
	} catch (e) {
		if (e instanceof JWTExpired && args?.acceptExpired) return e.payload as T;
		throw e;
	}
}

export const decodeBearerToken = async (token: string) => {
	if (!token) return null;

	const [type, value] = token.split(' ');
	if (type !== 'Bearer') throw new Error('Invalid token type');
	if (!value) return null;

	const JWKS = createRemoteJWKSet(new URL(`${process.env.FRONTEND_URL}/api/auth/jwks`));
	try {
		const { payload } = await jwtVerify<JWTPayload & BetterAuthUser>(value, JWKS, {
			issuer: process.env.FRONTEND_URL,
			audience: process.env.FRONTEND_URL,
		});
		return payload;
	} catch (e) {
		if (e instanceof JWTExpired) {
			throw new TRPCError({
				code: 'UNAUTHORIZED',
				message: 'Access token expired!',
			});
		} else if (e instanceof JWSInvalid) {
			console.error('JWS invalid...', {
				jwks: JWKS.jwks(),
			});
			throw new TRPCError({
				code: 'UNAUTHORIZED',
				message: 'Invalid token!',
			});
		}
		throw e;
	}
};
