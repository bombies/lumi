import { z } from 'zod';

export const USERNAME_REGEX = /^[a-z][a-z0-9_]{2,31}/g;
export const PASSWORD_REGEX =
	/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,255}$/g;
export const FIRST_NAME_REGEX = /^\p{L}[\p{L}\p{M}'-]{0,49}$/u;
export const LAST_NAME_REGEX = /^\p{L}[\p{L}\p{M}.'\-\s]{0,79}$/u;

export const createUserDto = z.object({
	email: z.string().email(),
	username: z
		.string()
		.regex(
			USERNAME_REGEX,
			'The username must be between 3 and 32 characters long and start with a letter. It can only contain lowercase letters, numbers, and underscores.',
		),
	firstName: z.string().regex(FIRST_NAME_REGEX, 'Invalid first name.'),
	lastName: z.string().regex(LAST_NAME_REGEX, 'Invalid last name.'),
	password: z
		.string()
		.regex(
			PASSWORD_REGEX,
			'The password must be between 8 and 255 characters long and should include: a upper and lowercase character, a number and a special character.',
		)
		.optional(),
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
			})
			.partial(),
	);

export type CreateUserDto = z.infer<typeof createUserDto>;
export type UpdateUserDto = z.infer<typeof updateUserDto>;
