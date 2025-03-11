'use client';

import { getQueryKey } from '@trpc/react-query';

import { trpc } from '@/lib/trpc/client';

export const useRouteInvalidation = (procedureOrRouters: Parameters<typeof getQueryKey>[0][]) => {
	const utils = trpc.useUtils();
	return () =>
		utils.invalidate(undefined, {
			queryKey: procedureOrRouters.map(router => getQueryKey(router)),
		});
};
