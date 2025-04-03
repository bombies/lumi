'use client';

import { trpc } from '@/lib/trpc/client';

export const GetRelationship = () => trpc.relationships.getRelationship.useQuery();
export const GetRelationshipPartner = () => trpc.relationships.getRelationshipPartner.useQuery();
export const LeaveRelationship = () => trpc.relationships.leaveRelationship.useMutation();
