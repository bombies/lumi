'use client';

import { useRouteInvalidation } from '@/lib/hooks/useRouteInvalidation';
import { trpc } from '@/lib/trpc/trpc-react';

export const CreateImportantDate = () => {
	const invalidateRoutes = useRouteInvalidation([trpc.calendar.getImportantDates]);

	return trpc.calendar.createImportantDate.useMutation({
		async onSuccess() {
			await invalidateRoutes();
		},
	});
};

export const GetImportantDates = (args: {
	startDate?: Date;
	endDate?: Date;
	limit?: number;
}) =>
	trpc.calendar.getImportantDates.useInfiniteQuery({
		limit: args.limit,
		startDate: args.startDate?.toISOString(),
		endDate: args.endDate?.toISOString(),
	}, {
		getNextPageParam: lastPage => lastPage.nextCursor,
	});

export const UpdateImportantDate = () => {
	const invalidateRoutes = useRouteInvalidation([trpc.calendar.getImportantDates]);

	return trpc.calendar.updateImportantDate.useMutation({
		async onSuccess() {
			await invalidateRoutes();
		},
	});
};

export const DeleteImportantDate = () => {
	const invalidateRoutes = useRouteInvalidation([trpc.calendar.getImportantDates]);

	return trpc.calendar.deleteImportantDate.useMutation({
		async onSuccess() {
			await invalidateRoutes();
		},
	});
};
