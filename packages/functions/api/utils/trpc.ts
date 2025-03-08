import { decodeBearerToken } from '@lumi/core/auth/auth.service';
import { TRPCError, initTRPC } from '@trpc/server';
import { CreateAWSLambdaContextOptions } from '@trpc/server/adapters/aws-lambda';
import { APIGatewayProxyEvent } from 'aws-lambda';

type Context = Awaited<ReturnType<typeof createContext>>;

export const t = initTRPC.context<Context>().create();
export function createContext({
	event,
	context,
	info,
}: CreateAWSLambdaContextOptions<APIGatewayProxyEvent>) {
	const authorizationHeader = event.headers.authorization;
	if (!authorizationHeader) return {};
	try {
		return {
			user: decodeBearerToken(authorizationHeader),
		};
	} catch (e) {
		console.error(e);
		return {};
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

export const protectedProcedure = publicProcedure.use(
	async function isAuthenticated(opts) {
		const { ctx } = opts;
		if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
		return opts.next({
			ctx: {
				user: ctx.user,
			},
		});
	},
);

export const mergeRouters = t.mergeRouters;
