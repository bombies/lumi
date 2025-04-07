import { TRPCError } from '@trpc/server';
import mime from 'mime';
import { Resource } from 'sst';

import { deleteUserRelationship, getRelationshipForUser } from '../relationships/relationship.service';
import { deleteItem, getItem, getItems, putItem, updateItem } from '../utils/dynamo/dynamo.service';
import { DynamoKey, EntityType } from '../utils/dynamo/dynamo.types';
import { ContentPaths, StorageClient } from '../utils/s3/s3.service';
import { getUUID } from '../utils/utils';
import { DatabaseUser, User } from './user.types';
import {
	CreateUserDto,
	GetUserAvatarUploadUrlDto,
	GetUsersByEmailDto,
	GetUsersByUsernameDto,
	UpdateUserDto,
} from './users.dto';

type CreateUserArgs = {
	sendOTP?: boolean;
};

export const createUser = async ({
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

	const userId = dto.id ?? getUUID();
	const [createdAt, updatedAt] = [new Date().toISOString(), new Date().toISOString()];
	await putItem<DatabaseUser>({
		pk: DynamoKey.user.pk(userId),
		sk: DynamoKey.user.sk(userId),
		gsi1pk: DynamoKey.user.gsi1pk(),
		gsi1sk: DynamoKey.user.gsi1sk(dto.username),
		gsi2pk: DynamoKey.user.gsi2pk(),
		gsi2sk: DynamoKey.user.gsi2sk(dto.email),
		entityType: EntityType.USER,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		...dto,
		id: userId,
	});

	return { id: userId, createdAt, updatedAt, verified: false, ...dto } as User;
};

function attachAvatarToUser(args: { user?: User; throws: true }): User;

function attachAvatarToUser(args: { user?: User; throws?: false }): User | undefined;

function attachAvatarToUser({ user, throws }: { user?: User; throws?: boolean }): User | undefined {
	if (!user)
		if (throws) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
		else return undefined;

	if (user.avatarKey)
		user.avatarUrl = ContentPaths.userAvatar(user.id, user.avatarKey, {
			withHost: true,
		});

	return user;
}

type GetUserByIdArgs = {
	projections?: (keyof User)[];
};

export const getUserById = async (userId: string, args?: GetUserByIdArgs) => {
	const res = await getItem<User>(DynamoKey.user.pk(userId), DynamoKey.user.sk(userId), {
		projectedAttributes: args?.projections,
	});

	return attachAvatarToUser({ user: res ?? undefined });
};

export const getUserByUsername = async (username: string) => {
	const res = (
		await getItems<User>({
			index: 'GSI1',
			queryExpression: {
				expression: '#gsi1pk = :gsi1pk AND #gsi1sk = :gsi1sk',
				variables: {
					':gsi1pk': DynamoKey.user.gsi1pk(),
					':gsi1sk': DynamoKey.user.gsi1sk(username),
				},
			},
		})
	).data[0];

	return attachAvatarToUser({ user: res });
};

export const getUsersByUsername = async ({ username, limit, cursor, projections }: GetUsersByUsernameDto) => {
	return getItems<User>({
		index: 'GSI1',
		queryExpression: {
			expression: '#gsi1pk = :gsi1pk AND begins_with(#gsi1sk, :gsi1sk)',
			variables: {
				':gsi1pk': DynamoKey.user.gsi1pk(),
				':gsi1sk': DynamoKey.user.gsi1sk(username),
			},
		},
		limit,
		cursor,
		projectedAttributes: projections,
		mapper: user => attachAvatarToUser({ user, throws: true }),
	});
};

export const getUsersByEmail = async ({ email, limit, cursor, projections }: GetUsersByEmailDto) => {
	return getItems<User>({
		index: 'GSI2',
		queryExpression: {
			expression: '#gsi2pk = :gsi2pk AND begins_with(#gsi2sk, :gsi2sk)',
			variables: {
				':gsi2pk': DynamoKey.user.gsi2pk(),
				':gsi2sk': DynamoKey.user.gsi2sk(email),
			},
		},
		limit,
		cursor,
		projectedAttributes: projections,
		mapper: user => attachAvatarToUser({ user, throws: true }),
	});
};

export const getUserByEmail = async (email: string) => {
	const res = (
		await getItems<User>({
			index: 'GSI2',
			queryExpression: {
				expression: '#gsi2pk = :gsi2pk AND #gsi2sk = :gsi2sk',
				variables: {
					':gsi2pk': DynamoKey.user.gsi2pk(),
					':gsi2sk': DynamoKey.user.gsi2sk(email),
				},
			},
		})
	).data[0];

	return attachAvatarToUser({ user: res });
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
	if (!(await userExists(userId)))
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'User not found',
		});

	return updateItem<User>({
		pk: DynamoKey.user.pk(userId),
		sk: DynamoKey.user.sk(userId),
		update: {
			...dto,
			updatedAt: new Date().toISOString(),
		},
	});
};

export const deleteUser = async (userId: string) => {
	await deleteUserRelationship(userId, { safeReturn: true });
	return deleteItem(DynamoKey.user.pk(userId), DynamoKey.user.sk(userId));
};

export const getUserAvatarUploadUrl = async ({
	userId,
	objectKey,
	fileExtension,
}: GetUserAvatarUploadUrlDto & {
	userId: string;
}) => {
	const storageBucket = new StorageClient(Resource.ContentBucket.name);
	return storageBucket.getSignedPutUrl(ContentPaths.userAvatar(userId, objectKey + '.' + fileExtension), {
		expires: 5 * 60,
		contentType: fileExtension && (mime.getType(fileExtension) ?? undefined),
	});
};
