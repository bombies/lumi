'use client';

import type { UpdateRelationshipDto } from '@/lib/api/modules/relationship/relationship.dto';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/api';

export const GetRelationship = () => useQuery({
	queryKey: ['relationships', 'self'],
	queryFn: () => apiClient.relationships.getRelationship(),
});

export const GetRelationshipPartner = () => useQuery({
	queryKey: ['relationships', 'partner'],
	queryFn: () => apiClient.relationships.getRelationshipPartner(),
});

export const LeaveRelationship = () => useMutation({
	mutationFn: () => apiClient.relationships.leaveRelationship(),
});

export const UpdateRelationship = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: UpdateRelationshipDto) => apiClient.relationships.updateRelationship(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['relationships', 'self'] });
		},
	});
};
