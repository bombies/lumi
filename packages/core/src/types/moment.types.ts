import { z } from 'zod';

import { momentMessageSchema, momentSchema } from '../moments/moments.dto';
import { EntityType } from '../utils/dynamo/dynamo.types';

export type Moment = z.infer<typeof momentSchema> & {
	id: string;
	createdAt: string;
	relationshipId: string;
	userId: string;
} & MomentExtras;

export type MomentExtras = Partial<{
	videoUrl: string;
	thumbnailUrl: string;
}>;

export type DatabaseMoment = Moment & {
	pk: string;
	sk: string;
	gsi1pk: string;
	gsi1sk: string;
	gsi2pk: string;
	gsi2sk: string;
	entityType: EntityType.MOMENT_DETAILS;
};

export type RelationshipMomentTag = {
	tag: string;
	associationCount: number;
	createdAt: string;
	relationshipId: string;
};

export type DatabaseRelationshipMomentTag = RelationshipMomentTag & {
	pk: string;
	sk: string;
	entityType: EntityType.RELATIONSHIP_MOMENT_TAG;
};

export type MomentTag = {
	tag: string;
	momentId: string;
	relationshipId: string;
	taggerId: string;
	createdAt: string;
};

export type DatabaseMomentTag = MomentTag & {
	pk: string;
	sk: string;
	gsi1pk: string;
	gsi1sk: string;
	entityType: EntityType.MOMENT_TAG;
};

export type MomentMessage = z.infer<typeof momentMessageSchema> & {
	id: string;
	timestamp: string;
};

export type DatabaseMomentMessage = MomentMessage & {
	pk: string;
	sk: string;
	gsi1pk: string;
	gsi1sk: string;
	entityType: EntityType.MOMENT_MESSAGE;
};
