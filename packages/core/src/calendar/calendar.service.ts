import type { CreateImportantDateDto, GetImportantDatesDto, UpdateImportantDateDto } from './calendar.dto';
import type { DatabaseImportantDate, ImportantDate } from './calendar.types';
import { TRPCError } from '@trpc/server';
import { dateToMMDD } from '../utils/datetime';
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
		gsi1pk: DynamoKey.importantDate.gsi1pk(relationshipId),
		gsi1sk: DynamoKey.importantDate.gsi1sk(mmDD, id),
		gsi2pk: DynamoKey.importantDate.gsi2pk(),
		gsi2sk: DynamoKey.importantDate.gsi2sk(mmDD, id),
		gsi3pk: DynamoKey.importantDate.gsi3pk(relationshipId, dto.type),
		gsi3sk: DynamoKey.importantDate.gsi3sk(mmDD, id),
		id,
		...dto,
		dateMMDD: mmDD,
		relationshipId,
		createdAt,
		entityType: EntityType.IMPORTANT_DATE,
	});
};

export const getImportantDatesForRelationship = async ({
	limit,
	cursor,
	startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
	endDate = (() => {
		const start = new Date(startDate);
		const EOM = new Date(start.getFullYear(), start.getMonth() + 1, 0);
		EOM.setHours(23, 59, 59, 999); // End of day
		return EOM.toISOString();
	})(),
	type,
	relationshipId,
}: GetImportantDatesDto & { relationshipId: string }) => {
	const initialStartDate = new Date(startDate);
	const initialEndDate = new Date(endDate);

	const adjustedEarlyStartDate = new Date(initialStartDate);
	const adjustedLateEndDate = new Date(initialEndDate);
	adjustedEarlyStartDate.setDate(adjustedEarlyStartDate.getDate() - 1);
	adjustedLateEndDate.setDate(adjustedLateEndDate.getDate() + 1);

	const startDateMMDD = dateToMMDD(new Date(adjustedEarlyStartDate));
	const endDateMMDD = dateToMMDD(new Date(adjustedLateEndDate));

	const dates = await getItems<ImportantDate>({
		index: type ? 'GSI3' : 'GSI1',
		queryExpression: {
			expression: type
				? '#gsi3pk = :gsi3pk and #gsi3sk between :startDate and :endDate'
				: '#gsi1pk = :gsi1pk and #gsi1sk between :startDate and :endDate',
			variables: {
				':gsi1pk': !type ? DynamoKey.importantDate.gsi1pk(relationshipId) : undefined,
				':gsi3pk': type ? DynamoKey.importantDate.gsi3pk(relationshipId, type) : undefined,
				':startDate': DynamoKey.importantDate.buildKey(startDateMMDD, 'event#'),
				':endDate': DynamoKey.importantDate.buildKey(endDateMMDD, 'event#'),
			},
		},
		limit,
		cursor,
	});

	const currentYear = new Date().getFullYear();
	const filteredDates = dates.data.filter((date) => {
		if (date.annual) return date;

		const dateYear = new Date(date.date).getFullYear();
		return dateYear === currentYear;
	});

	return {
		data: filteredDates,
		nextCursor: dates.nextCursor,
	};
};

export const getImportantDatesForDate = async (date: Date = new Date()) => {
	const dateMMDD = dateToMMDD(date);

	const dates = await getItems<ImportantDate>({
		queryExpression: {
			expression: '#pk = pk and begins_with(#sk, :sk)',
			variables: {
				':pk': DynamoKey.importantDate.gsi2pk(),
				':sk': DynamoKey.importantDate.buildKey(dateMMDD, 'event#'),
			},
		},
		exhaustive: true,
	}).then(res => res.data);

	const currentYear = new Date().getFullYear();
	return dates.filter((date) => {
		if (date.annual) return date;

		const dateYear = new Date(date.date).getFullYear();
		return dateYear === currentYear;
	});
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
		updatedAt: new Date().toISOString(),
	};

	if (dto.date || (dto.annual && !existingDate.annual)) {
		const dateMMDD = dateToMMDD(new Date(dto.date ?? existingDate.date));
		update.dateMMDD = dateMMDD;

		if (dto.annual !== false && (existingDate.annual || dto.annual)) {
			update.gsi1sk = DynamoKey.importantDate.gsi1sk(dateMMDD, eventId);
			update.gsi2sk = DynamoKey.importantDate.gsi2sk(dateMMDD, eventId);
		}
	}

	if (dto.type) {
		update.gsi3pk = DynamoKey.importantDate.gsi3pk(relationshipId, dto.type);
		update.gsi3sk = DynamoKey.importantDate.gsi3sk(existingDate.dateMMDD, eventId);
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
