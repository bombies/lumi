import { EntityType } from './dynamo.types';

export type User = {
	id: string;
	email: string;
	username: string;
	firstName: string;
	lastName: string;
	password?: string;
	createdAt: string;
	updatedAt: string;
	avatarKey?: string;
	relationshipId?: string;
};

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
