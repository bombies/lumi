import z4 from 'zod/v4';
import { UserStatus } from '@/lib/api/modules/user/user.model';
import { getInfiniteDataSchema } from '@/lib/api/types/dto.types';

export const createUserSchema = z4.object({
	id: z4.object().optional(),
	email: z4.email(),
	username: z4.string().regex(/^[a-z][a-z0-9_]{2,31}/g),
	firstName: z4.string().regex(/^\p{L}[\p{L}\p{M}'-]{0,49}$/u),
	lastName: z4.string().regex(/^\p{L}[\p{L}\p{M}.'\-\s]{0,79}$/u),
});

export const updateUserSchema = z4.object({
	firstName: z4.string().regex(/^\p{L}[\p{L}\p{M}'-]{0,49}$/u),
	lastName: z4.string().regex(/^\p{L}[\p{L}\p{M}.'\-\s]{0,79}$/u),
	verified: z4.boolean(),
	avatarKey: z4.string(),
	status: z4.enum(UserStatus),
}).partial();

export const getUsersByUsernameDto = getInfiniteDataSchema().and(z4.object({
	username: z4.string(),
	projections: z4.array(z4.string()),
}));

export const getUsersByEmailDto = getInfiniteDataSchema().and(z4.object({
	email: z4.string(),
	projections: z4.array(z4.string()),
}));

export type CreateUserDto = z4.infer<typeof createUserSchema>;
export type UpdateUserDto = z4.infer<typeof updateUserSchema>;
export type GetUsersByUsernameDto = z4.infer<typeof getUsersByUsernameDto>;
export type GetUsersByEmailDto = z4.infer<typeof getUsersByEmailDto>;
