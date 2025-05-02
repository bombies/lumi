'use client';

import { trpc } from '@/lib/trpc/trpc-react';

import { getQueryKey } from '@trpc/react-query';

export const useRouteInvalidation = (procedureOrRouters: Parameters<typeof getQueryKey>[0][]) => {
	const utils = trpc.useUtils();
	return () =>
		utils.invalidate(undefined, {
			queryKey: procedureOrRouters.map(router => getQueryKey(router)),
		});
};
