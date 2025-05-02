'use client';

import type { AppRouter } from '@lumi/functions/types';
import { createTRPCReact } from '@trpc/react-query';

export const trpc = createTRPCReact<AppRouter>();
