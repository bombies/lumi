import type { CreateAWSLambdaContextOptions } from '@trpc/server/adapters/aws-lambda';
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { decodeBearerToken } from '@lumi/core/auth/auth.service';
import { getRelationshipForUser } from '@lumi/core/relationships/relationship.service';
import { initTRPC, TRPCError } from '@trpc/server';

type Context = Awaited<ReturnType<typeof createContext>>;

export const t = initTRPC.context<Context>().create();
export async function createContext({ event }: CreateAWSLambdaContextOptions<APIGatewayProxyEvent>) {
	const headers = event.headers as Record<string, string | undefined>;
	const authorizationHeader = event.headers.authorization;
	if (!authorizationHeader) return { headers };

	const decodedToken = await decodeBearerToken(authorizationHeader);
	if (!decodedToken) return { headers };
	return {
		headers,
		user: {
			id: decodedToken.id,
		},
	};
}

export const createCallerFactory = t.createCallerFactory;

export const router = t.router;

export const publicProcedure = t.procedure.use(async (opts) => {
	const {
		ctx: { user },
	} = opts;

	return opts.next({
		ctx: { user: user ?? undefined },
	});
});

export const protectedProcedure = publicProcedure.use(async (opts) => {
	const { ctx } = opts;
	if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You are not authenticated!' });
	return opts.next({
		ctx: {
			user: ctx.user,
		},
	});
});

export const relationshipProcedure = protectedProcedure.use(async (opts) => {
	const { ctx } = opts;

	const relationship = await getRelationshipForUser(ctx.user.id);
	if (!relationship) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You are not in a relationship!' });

	return opts.next({
		ctx: {
			user: ctx.user,
			relationship,
		},
	});
});

export const mergeRouters = t.mergeRouters;
