import type { z } from 'zod';

import type { userDto } from '../users/users.dto';
import type { EntityType } from '../utils/dynamo/dynamo.types';

export type User = z.infer<typeof userDto> & UserExtras;
export type UserExtras = Partial<{
	avatarUrl: string;
}>;

export type DatabaseUser = User & {
	/**
	 * user#<id>
	 */
	pk: string;
	/**
	 * user#<id>
	 */
	sk: string;
	/**
	 * user#username
	 */
	gsi1pk: string;
	/**
	 * user#<username>
	 */
	gsi1sk: string;
	/**
	 * user#email
	 */
	gsi2pk: string;
	/**
	 * user#<email>
	 */
	gsi2sk: string;
	entityType: EntityType.USER;
};
