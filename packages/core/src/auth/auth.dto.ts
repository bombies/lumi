import { z } from 'zod';

import { PASSWORD_REGEX, createUserDto } from '../users/users.dto';

export const registerUserDto = createUserDto.and(
	z.object({
		password: z
			.string()
			.regex(
				PASSWORD_REGEX,
				'The password must be between 8 and 255 characters long and should include: a upper and lowercase character, a number and a special character.',
			),
	}),
);

export type RegisterUserDto = z.infer<typeof registerUserDto>;
