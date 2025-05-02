import { z } from 'zod';

import { createUserDto, PASSWORD_REGEX } from '../users/users.dto';

export const registerUserDto = createUserDto.and(
	z.object({
		password: z.string().regex(PASSWORD_REGEX, {
			error: 'The password must be between 8 and 255 characters long and should include: a upper and lowercase character, a number and a special character.',
		}),
	}),
);

export type RegisterUserDto = z.infer<typeof registerUserDto>;
