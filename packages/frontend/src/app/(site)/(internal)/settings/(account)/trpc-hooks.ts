'use client';

import { trpc } from '@/lib/trpc/client';

export const UpdateUser = () => trpc.users.updateSelf.useMutation();
