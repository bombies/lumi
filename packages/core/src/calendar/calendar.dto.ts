import z from 'zod';
import { createInfiniteDataDto } from '../types/infinite-data.dto';
import { ImportantDateType } from './calendar.types';

export const createImportantDateDto = z.object({
	title: z.string(),
	type: z.enum(ImportantDateType).default(ImportantDateType.OTHER),
	annual: z.boolean(),
	date: z.iso.datetime(),
	notes: z.string().optional(),
});

export const getImportantDatesDto = createInfiniteDataDto({
	defaultLimit: 100,
}).and(z.object({
	startDate: z.string(),
	endDate: z.string(),
	type: z.enum(ImportantDateType),
}).partial());

export const updateImportantDateDto = createImportantDateDto.partial();

export type CreateImportantDateDto = z.infer<typeof createImportantDateDto>;
export type GetImportantDatesDto = z.infer<typeof getImportantDatesDto>;
export type UpdateImportantDateDto = z.infer<typeof updateImportantDateDto>;
