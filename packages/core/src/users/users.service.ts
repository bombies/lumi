import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';

import { EntityType, KeyPrefix } from '../types/dynamo.types';
import { getInfiniteData } from '../types/infinite-data.dto';
import { DatabaseUser, User } from '../types/user.types';
import { dynamo, getDynamicUpdateStatements } from '../utils/dynamo/dynamo.service';
import { getUUID } from '../utils/utils';
import { CreateUserDto, GetUsersByEmailDto, GetUsersByUsernameDto, UpdateUserDto } from './users.dto';

type CreateUserArgs = {
	sendOTP?: boolean;
};

export const createUser = async ({
	password,
	args,
	...dto
}: CreateUserDto & {
	args?: CreateUserArgs;
}) => {
	if (await getUserByEmail(dto.email))
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'User with this email already exists',
		});

	if (await getUserByUsername(dto.username))
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'User with this username already exists',
		});

	const userId = getUUID();
	const [createdAt, updatedAt] = [new Date().toISOString(), new Date().toISOString()];
	const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
	await dynamo.put({
		TableName: process.env.TABLE_NAME,
		Item: {
			pk: `${KeyPrefix.USER}${userId}`,
			sk: `${KeyPrefix.USER}${userId}`,
			gsi1pk: `${KeyPrefix.USER}username`,
			gsi1sk: `${KeyPrefix.USER}${dto.username}`,
			gsi2pk: `${KeyPrefix.USER}email`,
			gsi2sk: `${KeyPrefix.USER}${dto.email}`,
			entityType: EntityType.USER,
			id: userId,
			password: hashedPassword,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			verified: false,
			...dto,
		} satisfies DatabaseUser,
	});

	return { id: userId, createdAt, updatedAt, verified: false, ...dto } as User;
};

export const verifyUserPassword = async (emailOrUsername: string, password: string) => {
	const user = await getUserByEmailOrUsername(emailOrUsername);
	if (!user) return false;

	if (!user.password) throw new Error('User does not have a password set. Please login with a different provider');

	const passwordValid = await bcrypt.compare(password, user.password);
	console.log(password, user.password, passwordValid);
	return passwordValid ? user : false;
};

export const getUserById = async (userId: string) => {
	const res = await dynamo.get({
		TableName: process.env.TABLE_NAME,
		Key: {
			pk: `${KeyPrefix.USER}${userId}`,
			sk: `${KeyPrefix.USER}${userId}`,
		},
	});

	return res.Item as User | undefined;
};

export const getUserByUsername = async (username: string) => {
	const res = await dynamo.query({
		TableName: process.env.TABLE_NAME,
		IndexName: 'GSI1',
		KeyConditionExpression: '#pk = :pk AND #sk = :sk',
		ExpressionAttributeNames: {
			'#pk': 'gsi1pk',
			'#sk': 'gsi1sk',
		},
		ExpressionAttributeValues: {
			':pk': `${KeyPrefix.USER_NAME}`,
			':sk': `${KeyPrefix.USER}${username}`,
		},
	});

	return res.Items?.[0] as User | undefined;
};

export const getUsersByUsername = async ({ username, limit, cursor }: GetUsersByUsernameDto) => {
	const res = await dynamo.query({
		TableName: process.env.TABLE_NAME,
		IndexName: 'GSI1',
		KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :sk)',
		ExpressionAttributeNames: {
			'#pk': 'gsi1pk',
			'#sk': 'gsi1sk',
		},
		ExpressionAttributeValues: {
			':pk': `${KeyPrefix.USER_NAME}`,
			':sk': `${KeyPrefix.USER}${username}`,
		},
		Limit: limit,
		ExclusiveStartKey: cursor,
	});

	return getInfiniteData<User>(res);
};

export const getUsersByEmail = async ({ email, limit, cursor }: GetUsersByEmailDto) => {
	const res = await dynamo.query({
		TableName: process.env.TABLE_NAME,
		IndexName: 'GSI2',
		KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :sk)',
		ExpressionAttributeNames: {
			'#pk': 'gsi2pk',
			'#sk': 'gsi12k',
		},
		ExpressionAttributeValues: {
			':pk': `${KeyPrefix.USER_EMAIL}`,
			':sk': `${KeyPrefix.USER}${email}`,
		},
		Limit: limit,
		ExclusiveStartKey: cursor,
	});

	return getInfiniteData<User>(res);
};

export const getUserByEmail = async (email: string) => {
	const res = await dynamo.query({
		TableName: process.env.TABLE_NAME,
		IndexName: 'GSI2',
		KeyConditionExpression: '#pk = :pk AND #sk = :sk',
		ExpressionAttributeNames: {
			'#pk': 'gsi2pk',
			'#sk': 'gsi2sk',
		},
		ExpressionAttributeValues: {
			':pk': `${KeyPrefix.USER}email`,
			':sk': `${KeyPrefix.USER}${email}`,
		},
	});

	return res.Items?.[0] as User | undefined;
};

export const userExists = async (value: string) => {
	const idUser = await getUserById(value);
	if (idUser) return true;
	return !!(await getUserByEmailOrUsername(value));
};

export const getUserByEmailOrUsername = async (emailOrUsername: string) => {
	const user = await getUserByEmail(emailOrUsername);
	if (!user) return getUserByUsername(emailOrUsername);
	return user;
};

export const updateUser = async (userId: string, dto: UpdateUserDto) => {
	const { updateStatements, expressionAttributeNames, expressionAttributeValues } = getDynamicUpdateStatements<User>({
		...dto,
		updatedAt: new Date().toISOString(),
	});

	if (!(await userExists(userId)))
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'User not found',
		});

	const res = await dynamo.update({
		TableName: process.env.TABLE_NAME,
		Key: {
			pk: `${KeyPrefix.USER}${userId}`,
			sk: `${KeyPrefix.USER}${userId}`,
		},
		UpdateExpression: updateStatements,
		ExpressionAttributeNames: expressionAttributeNames,
		ExpressionAttributeValues: expressionAttributeValues,
		ReturnValues: 'ALL_NEW',
	});

	if (res.$metadata.httpStatusCode !== 200)
		throw new TRPCError({
			message: `Error with updating user: Code ${res.$metadata.httpStatusCode}`,
			code: 'INTERNAL_SERVER_ERROR',
		});

	return res.Attributes as User;
};
