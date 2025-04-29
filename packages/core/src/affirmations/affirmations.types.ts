import type { z } from 'zod';

import type { affirmationSchema, receivedAffirmationSchema } from '../affirmations/affirmations.dto';
import type { EntityType } from '../utils/dynamo/dynamo.types';

export type Affirmation = z.infer<typeof affirmationSchema>;

export type DatabaseAffirmation = Affirmation & {
	/**
	 * `rship::affirmation#<relationship_id>`
	 */
	pk: string;
	/**
	 * `rship::affirmation#<owner_id>#<affirmation_id>`
	 */
	sk: string;
	entityType: EntityType.AFFIRMATION;
};

export type ReceivedAffirmation = z.infer<typeof receivedAffirmationSchema>;

export type DatabaseReceivedAffirmation = ReceivedAffirmation & {
	/**
	 * `rship::received_affirmation#<relationship_id>`
	 */
	pk: string;
	/**
	 * `rship::received_affirmation#<receiver_id>#<timestamp>`
	 */
	sk: string;
	entityType: EntityType.RECEIVED_AFFIRMATION;
};
