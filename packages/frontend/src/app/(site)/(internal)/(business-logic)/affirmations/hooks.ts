import { toast } from 'sonner';

import { useRouteInvalidation } from '@/lib/hooks/useRouteInvalidation';
import { trpc } from '@/lib/trpc/client';
import { handleTrpcError } from '@/lib/trpc/utils';

export const GetReceivedAffirmations = () =>
	trpc.affirmations.getReceivedAffirmations.useInfiniteQuery(
		{},
		{
			getNextPageParam: lastPage => lastPage.cursor,
		},
	);

export const GetOwnedAffirmations = () => trpc.affirmations.getAffirmations.useQuery();

export const CreateAffirmation = () => {
	const invalidateRoutes = useRouteInvalidation([trpc.affirmations.getAffirmations]);

	return trpc.affirmations.createAffirmation.useMutation({
		onSuccess() {
			toast.success('Affirmation created successfully');
			invalidateRoutes();
		},
		onError(e) {
			handleTrpcError(e);
		},
	});
};

export const UpdateAffirmation = () => {
	const invalidateRoutes = useRouteInvalidation([trpc.affirmations.getAffirmations]);

	return trpc.affirmations.updateAffirmation.useMutation({
		onSuccess() {
			toast.success('Affirmation updated successfully');
			invalidateRoutes();
		},
		onError(e) {
			handleTrpcError(e);
		},
	});
};

export const DeleteAffirmation = () => {
	const invalidateRoutes = useRouteInvalidation([trpc.affirmations.getAffirmations]);

	return trpc.affirmations.deleteAffirmation.useMutation({
		onSuccess() {
			toast.success('Affirmation deleted successfully');
			invalidateRoutes();
		},
		onError(e) {
			handleTrpcError(e);
		},
	});
};
