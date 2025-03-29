import { decodeBearerToken } from '@lumi/core/auth/auth.service';
import { getRelationshipForUser } from '@lumi/core/relationships/relationship.service';
import { TRPCError, initTRPC } from '@trpc/server';
import { CreateAWSLambdaContextOptions } from '@trpc/server/adapters/aws-lambda';
import { APIGatewayProxyEvent } from 'aws-lambda';

type Context = Awaited<ReturnType<typeof createContext>>;

export const t = initTRPC.context<Context>().create();
export async function createContext({ event, context, info }: CreateAWSLambdaContextOptions<APIGatewayProxyEvent>) {
	const headers = event.headers as Record<string, string | undefined>;
	const authorizationHeader = event.headers.authorization;
	if (!authorizationHeader) return { headers };
	try {
		const decodedToken = await decodeBearerToken(authorizationHeader);
		if (!decodedToken) return { headers };
		return {
			headers,
			user: {
				id: decodedToken.id,
			},
		};
	} catch (e) {
		throw e;
	}
}

export const createCallerFactory = t.createCallerFactory;

export const router = t.router;

export const publicProcedure = t.procedure.use(async function procedure(opts) {
	const {
		ctx: { user },
	} = opts;

	return opts.next({
		ctx: { user: user ?? undefined },
	});
});

export const protectedProcedure = publicProcedure.use(async function isAuthenticated(opts) {
	const { ctx } = opts;
	if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
	return opts.next({
		ctx: {
			user: ctx.user,
		},
	});
});

export const relationshipProcedure = protectedProcedure.use(async function isRelationship(opts) {
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
