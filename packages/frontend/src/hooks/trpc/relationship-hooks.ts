'use client';

import { useRouteInvalidation } from '@/lib/hooks/useRouteInvalidation';
import { trpc } from '@/lib/trpc/trpc-react';

export const GetRelationship = () => trpc.relationships.getRelationship.useQuery();
export const GetRelationshipPartner = () => trpc.relationships.getRelationshipPartner.useQuery();
export const LeaveRelationship = () => trpc.relationships.leaveRelationship.useMutation();

export const UpdateRelationship = () => {
	const invalidateRoutes = useRouteInvalidation([trpc.relationships.getRelationship]);
	return trpc.relationships.updateRelationship.useMutation({
		onSuccess: () => {
			invalidateRoutes();
		},
	});
};
