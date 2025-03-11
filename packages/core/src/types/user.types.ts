import { z } from 'zod';

import { userDto } from '../users/users.dto';
import { EntityType } from './dynamo.types';

export type User = z.infer<typeof userDto>;

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
