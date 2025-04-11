import * as Sentry from '@sentry/aws-serverless';

export const initSentry = () => {
	return Sentry.init({
		dsn: process.env.SENTRY_DSN,
		tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE),
	});
};
