import type { EntityType } from '../utils/dynamo/dynamo.types';

export enum ImportantDateType {
	MOVIE_DATE = 'movie_date',
	ANNIVERSARY = 'anniversary',
	BIRTHDAY = 'birthday',

	OTHER = 'other',
}

export type ImportantDate = {
	id: string;
	type: ImportantDateType;
	title: string;
	date: string;
	dateMMDD: string;
	annual: boolean;
	notes?: string;
	relationshipId: string;
	createdAt: string;
	updatedAt?: string;
};

export type DatabaseImportantDate = ImportantDate & {
	pk: string;
	sk: string;
	gsi1pk: string;
	gsi1sk: string;
	gsi2pk: string;
	gsi2sk: string;
	gsi3pk: string;
	gsi3sk: string;
	entityType: EntityType.IMPORTANT_DATE;
};
