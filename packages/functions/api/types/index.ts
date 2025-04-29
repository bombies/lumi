import type { appRouter } from '../router';

export type ReadonlyHeaders = Headers & {
	/** @deprecated Method unavailable on `ReadonlyHeaders`. Read more: https://nextjs.org/docs/app/api-reference/functions/headers */
	append: (...args: any[]) => void;
	/** @deprecated Method unavailable on `ReadonlyHeaders`. Read more: https://nextjs.org/docs/app/api-reference/functions/headers */
	set: (...args: any[]) => void;
	/** @deprecated Method unavailable on `ReadonlyHeaders`. Read more: https://nextjs.org/docs/app/api-reference/functions/headers */
	delete: (...args: any[]) => void;
};

export type AppRouter = typeof appRouter;
