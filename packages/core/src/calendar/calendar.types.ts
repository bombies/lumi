import type { EntityType } from '../utils/dynamo/dynamo.types';

export type ImportantDate = {
	id: string;
	title: string;
	date: string;
	dateMMDD?: string;
	annual: boolean;
	notes?: string;
	relationshipId: string;
	createdAt: string;
	updatedAt?: string;
};

export type DatabaseImportantDate = ImportantDate & {
	pk: string;
	sk: string;
	gsi1pk?: string;
	gsi1sk?: string;
	gsi2pk?: string;
	gsi2sk?: string;
	entityType: EntityType.IMPORTANT_DATE;
};
