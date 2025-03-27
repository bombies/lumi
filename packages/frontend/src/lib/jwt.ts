import { SignJWT } from 'jose';

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
