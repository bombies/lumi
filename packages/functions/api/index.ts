import * as Sentry from '@sentry/aws-serverless';
import { awsLambdaRequestHandler } from '@trpc/server/adapters/aws-lambda';

import { initSentry } from '../utils/sentry';
import { appRouter } from './router';
import { createContext } from './utils/trpc';

initSentry();

export const handler = Sentry.wrapHandler(
	awsLambdaRequestHandler({
		router: appRouter,
		createContext,
		onError({ error, type, path, input }) {
			if (error.code === 'INTERNAL_SERVER_ERROR') {
				Sentry.captureException(error);
				console.error('Error:', error);
				console.debug('Type:', type);
				console.debug('Path:', path);
				console.debug('Input:', JSON.stringify(input, null, 4));
			}
		},
	}),
);
