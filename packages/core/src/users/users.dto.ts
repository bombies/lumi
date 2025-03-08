import { z } from 'zod';

export const PASSWORD_REGEX =
	/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,255}$/g;
export const FIRST_NAME_REGEX = /^\p{L}[\p{L}\p{M}'-]{0,49}$/u;
export const LAST_NAME_REGEX = /^\p{L}[\p{L}\p{M}.'\-\s]{0,79}$/u;

export const createUserDto = z.object({
	email: z.string().email(),
	username: z.string().regex(/^[a-z][a-z0-9_]{2,31}/g),
	firstName: z.string().regex(FIRST_NAME_REGEX),
	lastName: z.string().regex(LAST_NAME_REGEX),
	password: z.string().regex(PASSWORD_REGEX).optional(),
});

export type CreateUserDto = z.infer<typeof createUserDto>;
