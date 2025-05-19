import type { CreateImportantDateDto, GetImportantDatesDto, UpdateImportantDateDto } from './calendar.dto';
import type { DatabaseImportantDate, ImportantDate } from './calendar.types';
import { TRPCError } from '@trpc/server';
import { dateToMMDD, endOfMonth, startOfMonth } from '../utils/datetime';
import { deleteItem, getItem, getItems, putItem, updateItem } from '../utils/dynamo/dynamo.service';
import { DynamoKey, EntityType } from '../utils/dynamo/dynamo.types';
import { getUUID } from '../utils/utils';

export const createImportantDate = async ({ relationshipId, ...dto }: CreateImportantDateDto & { relationshipId: string }) => {
	const id = getUUID();
	const createdAt = new Date().toISOString();
	const mmDD = dateToMMDD(new Date(dto.date));
	return putItem<DatabaseImportantDate>({
		pk: DynamoKey.importantDate.pk(relationshipId),
		sk: DynamoKey.importantDate.sk(id),
		gsi1pk: dto.annual ? DynamoKey.importantDate.gsi1pk(relationshipId) : undefined,
		gsi1sk: dto.annual ? DynamoKey.importantDate.gsi1sk(mmDD, id) : undefined,
		gsi2pk: dto.annual ? DynamoKey.importantDate.gsi2pk() : undefined,
		gsi2sk: dto.annual ? DynamoKey.importantDate.gsi2sk(mmDD, id) : undefined,
		id,
		...dto,
		dateMMDD: dto.annual ? mmDD : undefined,
		relationshipId,
		createdAt,
		entityType: EntityType.IMPORTANT_DATE,
	});
};

export const getImportantDatesForRelationship = async ({
	limit,
	cursor,
	startDate = startOfMonth().toISOString(),
	endDate = endOfMonth(new Date(startDate)).toISOString(),
	relationshipId,
}: GetImportantDatesDto & { relationshipId: string }) => {
	const startDateMMDD = dateToMMDD(new Date(startDate));
	const endDateMMDD = dateToMMDD(new Date(endDate));

	return getItems<ImportantDate>({
		index: 'GSI1',
		queryExpression: {
			expression: '#gsi1pk = :gsi1pk and #gsi1sk between :startDate and :endDate',
			variables: {
				':gsi1pk': DynamoKey.importantDate.gsi1pk(relationshipId),
				':startDate': DynamoKey.importantDate.buildKey(startDateMMDD, 'event#'),
				':endDate': DynamoKey.importantDate.buildKey(endDateMMDD, 'event#'),
			},
		},
		limit,
		cursor,
	});
};

export const getImportantDatesForDate = async (date: Date = new Date()) => {
	const dateMMDD = dateToMMDD(date);

	return getItems<ImportantDate>({
		queryExpression: {
			expression: '#pk = pk and begins_with(#sk, :sk)',
			variables: {
				':pk': DynamoKey.importantDate.gsi2pk(),
				':sk': DynamoKey.importantDate.buildKey(dateMMDD, 'event#'),
			},
		},
		exhaustive: true,
	}).then(res => res.data);
};

export const updateImportantDate = async ({
	relationshipId,
	eventId,
	...dto
}: UpdateImportantDateDto & { relationshipId: string; eventId: string }) => {
	const existingDate = await getItem<ImportantDate>(
		DynamoKey.importantDate.pk(relationshipId),
		DynamoKey.importantDate.sk(eventId),
	);

	if (!existingDate)
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'There is no event with that ID!',
		});

	const update: Partial<DatabaseImportantDate> = {
		...dto,
	};

	if (dto.date || (dto.annual && !existingDate.annual)) {
		const dateMMDD = dateToMMDD(new Date(dto.date ?? existingDate.date));
		update.dateMMDD = dateMMDD;

		if (dto.annual !== false && (existingDate.annual || dto.annual)) {
			update.gsi1sk = DynamoKey.importantDate.gsi1sk(dateMMDD, eventId);
			update.gsi2sk = DynamoKey.importantDate.gsi2sk(dateMMDD, eventId);
		}
	}

	return updateItem<DatabaseImportantDate>({
		pk: DynamoKey.importantDate.pk(relationshipId),
		sk: DynamoKey.importantDate.sk(eventId),
		update,
	});
};

export const deleteImportantDate = async ({
	relationshipId,
	eventId,
}: { relationshipId: string; eventId: string }) => {
	return deleteItem(
		DynamoKey.importantDate.pk(relationshipId),
		DynamoKey.importantDate.sk(eventId),
	);
};
