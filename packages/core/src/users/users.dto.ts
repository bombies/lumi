import { z } from 'zod';

import { createInfiniteDataDto } from '../types/infinite-data.dto';

export const USERNAME_REGEX = /^[a-z][a-z0-9_]{2,31}/g;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,255}$/g;
export const FIRST_NAME_REGEX = /^\p{L}[\p{L}\p{M}'-]{0,49}$/u;
export const LAST_NAME_REGEX = /^\p{L}[\p{L}\p{M}.'\-\s]{0,79}$/u;

export const userDto = z.object({
	id: z.string(),
	email: z.string(),
	username: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
	avatarKey: z.string().optional(),
	relationshipId: z.string().optional(),
	status: z.enum(['online', 'offline', 'idle']).optional(),
});

export const createUserDto = z.object({
	id: z.string().optional(),
	email: z.string().email(),
	username: z
		.string()
		.regex(
			USERNAME_REGEX,
			'The username must be between 3 and 32 characters long and start with a letter. It can only contain lowercase letters, numbers, and underscores.',
		),
	firstName: z.string().regex(FIRST_NAME_REGEX, 'Invalid first name.'),
	lastName: z.string().regex(LAST_NAME_REGEX, 'Invalid last name.'),
});

export const updateUserDto = createUserDto
	.omit({
		username: true,
		email: true,
	})
	.partial()
	.and(
		z
			.object({
				verified: z.boolean(),
				avatarKey: z.string().optional(),
				relationshipId: z.string().optional(),
				status: z.enum(['online', 'offline', 'idle']).optional(),
			})
			.partial(),
	);

const userProjections = z
	.object({
		projections: z.array(userDto.keyof()),
	})
	.partial();

export const getUsersByUsernameDto = createInfiniteDataDto({ defaultLimit: 10 })
	.and(
		z.object({
			username: z.string(),
		}),
	)
	.and(userProjections);

export const getUsersByEmailDto = createInfiniteDataDto({ defaultLimit: 10 })
	.and(
		z.object({
			email: z.string(),
		}),
	)
	.and(userProjections);

export type CreateUserDto = z.infer<typeof createUserDto>;
export type UpdateUserDto = z.infer<typeof updateUserDto>;
export type GetUsersByUsernameDto = z.infer<typeof getUsersByUsernameDto>;
export type GetUsersByEmailDto = z.infer<typeof getUsersByEmailDto>;
