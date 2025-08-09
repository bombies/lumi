import type { DynamoEntityType, DynamoGSI1Keys, DynamoGSI2Keys, DynamoRecord } from '@/lib/api/types/dynamo.types';

export enum UserStatus {
	ONLINE = 'online',
	OFFLINE = 'offline',
	IDLE = 'idle',
}

export type User = DynamoRecord<DynamoEntityType.USER> & DynamoGSI1Keys & DynamoGSI2Keys & {
	id: string;
	email: string;
	username: string;
	firstName: string;
	lastName: string;
	createdAt: string;
	updatedAt: string;
	avatarKey: string;
	avatarUrl?: string;
	relationshipId: string;
	status: string;
};
