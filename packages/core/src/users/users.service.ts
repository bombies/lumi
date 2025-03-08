import { TRPCError } from '@trpc/server';
import crypto from 'crypto';
import { Resource } from 'sst';

import { EntityType, KeyPrefix } from '../types/dynamo.types';
import { DatabaseUser, User } from '../types/user.types';
import { dynamo } from '../utils/dynamo/dynamo.service';
import { CreateUserDto } from './users.dto';

export const createUser = async ({ password, ...dto }: CreateUserDto) => {
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

	const userId = crypto.randomUUID();
	const [createdAt, updatedAt] = [new Date().toISOString(), new Date().toISOString()];
	await dynamo.put({
		TableName: Resource.Database.name,
		Item: {
			pk: `${KeyPrefix.USER}${userId}`,
			sk: `${KeyPrefix.USER}${userId}`,
			gsi1pk: `${KeyPrefix.USER}username`,
			gsi1sk: `${KeyPrefix.USER}${dto.username}`,
			gsi2pk: `${KeyPrefix.USER}email`,
			gsi2sk: `${KeyPrefix.USER}${dto.email}`,
			entityType: EntityType.USER,
			id: userId,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			...dto,
		} satisfies DatabaseUser,
	});

	return { id: userId, createdAt, updatedAt, ...dto } as User;
};

export const getUserById = async (userId: string) => {
	const res = await dynamo.get({
		TableName: Resource.Database.name,
		Key: {
			pk: `${KeyPrefix.USER}${userId}`,
			sk: `${KeyPrefix.USER}${userId}`,
		},
	});

	return res.Item as User | undefined;
};

export const getUserByUsername = async (username: string) => {
	const res = await dynamo.query({
		TableName: Resource.Database.name,
		IndexName: 'GSI1',
		KeyConditionExpression: '#pk = :pk AND #sk = :sk',
		ExpressionAttributeNames: {
			'#pk': 'gsi1pk',
			'#sk': 'gsi1sk',
		},
		ExpressionAttributeValues: {
			':pk': `${KeyPrefix.USER}username`,
			':sk': `${KeyPrefix.USER}${username}`,
		},
	});

	return res.Items?.[0] as User | undefined;
};

export const getUserByEmail = async (email: string) => {
	const res = await dynamo.query({
		TableName: Resource.Database.name,
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

export const getUserByEmailOrUsername = async (emailOrUsername: string) => {
	const user = await getUserByEmail(emailOrUsername);
	if (!user) return getUserByUsername(emailOrUsername);
	return user;
};
