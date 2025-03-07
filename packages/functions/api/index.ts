import { initTRPC } from "@trpc/server";
import {
    awsLambdaRequestHandler,
    CreateAWSLambdaContextOptions,
} from "@trpc/server/adapters/aws-lambda";
import { APIGatewayProxyEvent } from "aws-lambda";

function createContext({
    event,
    context,
    info,
}: CreateAWSLambdaContextOptions<APIGatewayProxyEvent>) {
    const authorizationHeader = event.headers.authorization;
    if (!authorizationHeader) return {};
    try {
        return {};
    } catch (e) {
        console.error(e);
        return {};
    }
}

type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();
export const router = t.router;
export const publicProcedure = t.procedure.use(async function procedure(opts) {
    const { ctx } = opts;

    return opts.next({
        ctx: {},
    });
});
export const mergeRouters = t.mergeRouters;
export const createCallerFactory = t.createCallerFactory;

export const appRouter = router({});

export type AppRouter = typeof appRouter;

export const handler = awsLambdaRequestHandler({
    router: appRouter,
    createContext,
    onError({ error, type, path, input, ctx, req }) {
        if (error.code === "INTERNAL_SERVER_ERROR") {
            console.error("Error:", error);
            console.debug("Type:", type);
            console.debug("Path:", path);
            console.debug("Input:", JSON.stringify(input, null, 4));
        }
    },
});
