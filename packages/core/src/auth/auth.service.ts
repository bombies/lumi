import { TRPCError } from '@trpc/server';
import { JsonWebTokenError, JwtPayload, SignOptions, sign, verify } from 'jsonwebtoken';
import { User as NextAuthUser } from 'next-auth';
import otopGenerator from 'otp-generator';
import { Resource } from 'sst';

import { DatabaseUserOTP, UserOTP } from '../types/auth.types';
import { EntityType, KeyPrefix } from '../types/dynamo.types';
import { User } from '../types/user.types';
import {
	createUser,
	getUserByEmail,
	getUserById,
	updateUser,
} from '../users/users.service';
import { dynamo } from '../utils/dynamo/dynamo.service';
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

export function encodeJwtToken(payload: NextAuthUser, opts?: SignOptions) {
	return sign(payload, process.env.AUTH_SECRET!, {
		expiresIn: '7d',
		...opts,
	});
}

export const decodeBearerToken = (token: string) => {
	if (!token) return null;

	const [type, value] = token.split(' ');
	if (type !== 'Bearer') throw new Error('Invalid token type');
	if (!value) return null;

	let decodedJwt: string | JwtPayload | undefined = undefined;
	try {
		decodedJwt = verify(value, process.env.AUTH_SECRET!);
	} catch (e) {
		if (e instanceof JsonWebTokenError)
			throw new TRPCError({
				message: `Error with decoding JWT token!\n${JSON.stringify(e, null, 2)}`,
				code: 'UNAUTHORIZED',
			});
		throw e;
	}

	return typeof decodedJwt === 'string'
		? (JSON.parse(decodedJwt) as Required<NextAuthUser>)
		: (decodedJwt as Required<NextAuthUser>);
};

export const generateOTPForUserId = async (userId: string) => {
	const user = await getUserById(userId);
	if (!user)
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'There is no user with that ID!',
		});

	return generateOTP(user);
};

export const generateOTP = async (user: User) => {
	const otp = otopGenerator.generate(6, {
		lowerCaseAlphabets: false,
		specialChars: false,
	});

	const data = {
		code: otp,
		expiresAt: new Date(Date.now() + 5 * 60 * 1000).getTime(),
		userId: user.id,
	} satisfies UserOTP;
	const res = await dynamo.put({
		TableName: Resource.Database.name,
		Item: {
			pk: `${KeyPrefix.OTP}${user.id}`,
			sk: `${KeyPrefix.OTP}${user.id}`,
			...data,
			entityType: EntityType.OTP,
		} satisfies DatabaseUserOTP,
	});

	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			message: `Error with generating OTP: Code ${res.$metadata.httpStatusCode}`,
			code: 'INTERNAL_SERVER_ERROR',
		});

	return data;
};

export const deleteOTPForUser = async (userId: string) => {
	const res = await dynamo.delete({
		TableName: Resource.Database.name,
		Key: {
			pk: `${KeyPrefix.OTP}${userId}`,
			sk: `${KeyPrefix.OTP}${userId}`,
		},
	});

	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			message: `Error with deleting OTP: Code ${res.$metadata.httpStatusCode}`,
			code: 'INTERNAL_SERVER_ERROR',
		});

	return true;
};

export const getOTPForUser = async (userId: string) => {
	const res = await dynamo.get({
		TableName: Resource.Database.name,
		Key: {
			pk: `${KeyPrefix.OTP}${userId}`,
			sk: `${KeyPrefix.OTP}${userId}`,
		},
	});

	return res.Item as UserOTP | undefined;
};

export const userHasOTPPending = async (userId: string) => {
	const otp = await getOTPForUser(userId);
	if (!otp) return false;

	if (otp.expiresAt < Date.now()) {
		deleteOTPForUser(userId);
		return false;
	}

	return true;
};

export const verifyOTPForUser = async (userId: string, code: string) => {
	const otp = await getOTPForUser(userId);
	if (!otp) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No OTP found' });

	if (otp.code !== code)
		throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid OTP' });

	if (otp.expiresAt < Date.now()) {
		await deleteOTPForUser(userId);
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'OTP has expired. Please request a new one',
		});
	}

	await updateUser(userId, { isVerified: true });

	return true;
};
