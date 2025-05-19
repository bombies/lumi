import { createImportantDateDto, getImportantDatesDto, updateImportantDateDto } from '@lumi/core/calendar/calendar.dto';
import { createImportantDate, deleteImportantDate, getImportantDatesForRelationship, updateImportantDate } from '@lumi/core/calendar/calendar.service';
import z from 'zod';
import { relationshipProcedure, router } from '../../utils/trpc';

export const calendarRouter = router({
	createImportantDate: relationshipProcedure
		.input(createImportantDateDto)
		.mutation(({ input, ctx: { relationship } }) =>
			createImportantDate({ ...input, relationshipId: relationship.id })),

	getImportantDates: relationshipProcedure
		.input(getImportantDatesDto)
		.query(({ input, ctx: { relationship } }) =>
			getImportantDatesForRelationship({ ...input, relationshipId: relationship.id })),

	updateImportantDate: relationshipProcedure
		.input(updateImportantDateDto.and(z.object({
			eventId: z.uuid(),
		})))
		.mutation(({ input, ctx: { relationship } }) =>
			updateImportantDate({ ...input, relationshipId: relationship.id })),

	deleteImportantDate: relationshipProcedure
		.input(z.uuid())
		.mutation(({ input, ctx: { relationship } }) => {
			return deleteImportantDate({ relationshipId: relationship.id, eventId: input });
		}),
});
