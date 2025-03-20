import { QueryCommandOutput } from '@aws-sdk/lib-dynamodb';
import { z } from 'zod';

export const infiniteDataDto = z
	.object({
		limit: z.number().positive(),
		cursor: z.record(z.string()),
	})
	.partial();

export const infiniteDataOrderDto = z.object({
	order: z.enum(['asc', 'desc']),
});

export const infiniteDataOrderDtoWithDefault = (defaultValue: 'asc' | 'desc') =>
	z.object({
		order: z.enum(['asc', 'desc']).default(defaultValue),
	});

export const createInfiniteDataDto = ({
	minLimit,
	maxLimit,
	defaultLimit,
}: {
	minLimit?: number;
	maxLimit?: number;
	defaultLimit?: number;
}) => {
	const limit = z.number().min(minLimit ?? 0);

	if (maxLimit !== undefined) limit.max(maxLimit);

	if (defaultLimit !== undefined) limit.default(defaultLimit);

	return z
		.object({
			limit,
			cursor: z.record(z.string()),
		})
		.partial();
};

export type InfiniteData<T> = {
	data: T[];
	cursor?: Record<string, string> | null;
};

export const getInfiniteData = async <T = unknown>(
	queryResult: QueryCommandOutput,
	itemMapper?: (item: T) => T | Promise<T>,
) => {
	let data: T[] = [];
	let intermediateData =
		(itemMapper ? queryResult?.Items?.map(item => itemMapper(item as T)) : (queryResult.Items as T[])) ?? [];

	if (intermediateData.length && intermediateData[0] instanceof Promise) {
		data = await Promise.all(intermediateData);
	} else {
		data = intermediateData as T[];
	}

	return {
		data,
		cursor: queryResult.LastEvaluatedKey as Record<string, string> | undefined,
	};
};

export const buildInfiniteData = <T = unknown>(data: T[], cursor?: Record<string, string>) => {
	return {
		data,
		cursor,
	};
};
