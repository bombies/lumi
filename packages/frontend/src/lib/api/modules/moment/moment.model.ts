import type { DynamoEntityType, DynamoGSI1Keys, DynamoGSI2Keys, DynamoRecord } from '@/lib/api/types/dynamo.types';

export type Moment = DynamoRecord<DynamoEntityType.MOMENT_DETAILS>
	& DynamoGSI1Keys & DynamoGSI2Keys & {
		id: string;
		title: string;
		normalizedTitle: string;
		description: string;
		objectKey: string;
		thumbnailObjectKey?: string;
		relationshipId: string;
		userId: string;
		createdAt: string;
		videoUrl?: string;
		thumbnailUrl?: string;
	};

export enum MomentMessageState {
	SENT = 'sent',
	DELIVERED = 'delivered',
	READ = 'read',
}

export type MomentMessage = DynamoRecord<DynamoEntityType.MOMENT_MESSAGE>
	& DynamoGSI1Keys & {
		id: string;
		senderId: string;
		momentId: string;
		content: string;
		repliedTo?: string;
		reaction?: string;
		isDeleted: boolean;
		state?: MomentMessageState;
		timestamp: string;
		updatedAt: string;
	};

export type RelationshipMomentTag = DynamoRecord<DynamoEntityType.RELATIONSHIP_MOMENT_TAG> & {
	tag: string;
	associationCount: string;
	relationshipId: string;
	createdAt: string;
};

export type MomentTag = DynamoRecord<DynamoEntityType.MOMENT_TAG>
	& DynamoGSI1Keys & {
		tag: string;
		momentId: string;
		relationshipId: string;
		taggerId: string;
		createdAt: string;
	};
