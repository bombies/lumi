import { z } from 'zod';

import { momentMessageSchema, momentSchema } from '../moments/moments.dto';
import { EntityType } from './dynamo.types';

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
