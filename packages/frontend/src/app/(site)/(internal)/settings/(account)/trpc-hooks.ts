'use client';

import { trpc } from '@/lib/trpc/client';

export const UpdateUser = () => trpc.users.updateSelf.useMutation();
export const GetSelfUser = () => trpc.users.getSelf.useQuery();
export const GetSelfUserOnDemand = () => trpc.users.getSelfOnDemand.useMutation();
