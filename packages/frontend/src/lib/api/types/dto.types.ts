import z4 from 'zod/v4';

export const getInfiniteDataSchema = (args?: {
	defaultLimit?: number;
	withOrder?: boolean | {
		defaultOrder?: 'asc' | 'desc';
	};
}) => {
	const schema = z4.object({
		limit: z4.int32().min(1).max(100).default(args?.defaultLimit ?? 10),
		cursor: z4.record(z4.string(), z4.any()).nullish(),
	}).partial();

	return args?.withOrder
		? schema.and(z4.object({
				order: z4.enum(['asc', 'desc'])
					.default(
						typeof args.withOrder === 'object'
							? args.withOrder.defaultOrder ?? 'desc'
							: 'desc',
					),
			}).partial())
		: schema;
};

export type InfiniteData<T> = {
	data: T[];
	nextCursor: Record<string, any> | null;
};

export type TupledInfiniteData<T> = {
	data: T[];
	nextCursor: [Record<string, any> | null, Record<string, any> | null];
};

export type InfiniteDataArgs = Partial<{
	limit: number;
}>;

export type InfiniteDataOrderArgs = {
	order: 'asc' | 'desc';
};

export type InfiniteDataWithOrderArgs = Partial<InfiniteDataArgs & InfiniteDataOrderArgs>;

export type GetUploadUrlDto = {
	objectKey: string;
	fileExtension: string;
};
