import type { User } from '@lumi/core/users/user.types';
import type { DynamoEntityType, DynamoGSI1Keys, DynamoGSI2Keys, DynamoRecord } from '@/lib/api/types/dynamo.types';

export type Relationship = DynamoRecord<DynamoEntityType.RELATIONSHIP> & DynamoGSI1Keys & {
	id: string;
	partner1: string;
	partner2: string;
	partner?: User;
	self?: User;
	createdAt: string;
	anniversary: string;
	anniversaryMMDD: string;
};

export type RelationshipRequest = DynamoRecord<DynamoEntityType.RELATIONSHIP_REQUEST> & DynamoGSI1Keys & DynamoGSI2Keys & {
	id: string;
	sender: string;
	receiver: string;
	createdAt: string;
	otherUser?: RelationshipRequestOtherUser;
};

export type RelationshipRequestOtherUser = {
	id: string;
	username: string;
	firstName: string;
	lastName: string;
};
