import redis from '@lumi/core/redis/redis';
import { createTrpcRedisLimiter } from '@trpc-limiter/redis';
import { TRPCError } from '@trpc/server';
import { ProcedureBuilder } from '@trpc/server/unstable-core-do-not-import';
import requestIp, { RequestHeaders } from 'request-ip';

import { t } from './trpc';

type RateLimiterArgs = Omit<Parameters<typeof createTrpcRedisLimiter>[0], 'fingerprint' | 'redisClient'>;

const createRateLimiter = (args?: RateLimiterArgs) =>
	createTrpcRedisLimiter<typeof t>({
		fingerprint: ({ headers: reqHeaders }) => {
			const headers: RequestHeaders = {
				'x-client-ip': reqHeaders['x-client-ip'] ?? undefined,
				'x-forwarded-for': reqHeaders['x-forwarded-for'] ?? undefined,
				'x-real-ip': reqHeaders['x-real-ip'] ?? undefined,
				'x-cluster-client-ip': reqHeaders['x-cluster-client-ip'] ?? undefined,
				'x-forwarded': reqHeaders['x-forwarded'] ?? undefined,
				'forwarded-for': reqHeaders['forwarded-for'] ?? undefined,
				forwarded: reqHeaders['forwarded'] ?? undefined,
			};

			const ipAddr = requestIp.getClientIp({
				headers,
			});

			if (!ipAddr)
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Could not fetch client IP address!',
				});

			return ipAddr;
		},
		message: hitInfo => `Too many requests, please try again later. (${hitInfo})`,
		redisClient: redis,
		...args,
	});

export const rateLimitedProcedure = <
	TContext,
	TMeta,
	TContextOverrides,
	TInputIn,
	TInputOut,
	TOutputIn,
	TOutputOut,
	TCaller extends boolean,
>(
	procedure: ProcedureBuilder<
		TContext,
		TMeta,
		TContextOverrides,
		TInputIn,
		TInputOut,
		TOutputIn,
		TOutputOut,
		TCaller
	>,
	args: RateLimiterArgs,
) => procedure.use(createRateLimiter(args));
