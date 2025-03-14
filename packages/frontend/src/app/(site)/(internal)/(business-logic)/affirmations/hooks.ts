import { trpc } from '@/lib/trpc/client';

export const GetReceivedAffirmations = () =>
	trpc.affirmations.getReceivedAffirmations.useInfiniteQuery(
		{},
		{
			getNextPageParam: lastPage => lastPage.cursor,
		},
	);
