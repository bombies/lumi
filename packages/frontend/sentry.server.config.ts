// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

const stage = process.env.APP_STAGE || 'development';
const prodDSN = 'https://80ab0f88a546dccb3562462dc40792a7@o4509089429848064.ingest.us.sentry.io/4509090414002176';
const stagingDSN = 'https://fbd6944a1bb4282864d890cd74b6bfc4@o4509089429848064.ingest.us.sentry.io/4509089510457344';
const devDSN = 'https://832bf9cdf00ea9af1efee2de72bea6e7@o4509089429848064.ingest.us.sentry.io/4509089435418624';

Sentry.init({
	dsn: stage === 'production' ? prodDSN : stage === 'staging' ? stagingDSN : devDSN,

	// Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
	tracesSampleRate: 1,

	// Setting this option to true will print useful information to the console while you're setting up Sentry.
	debug: false,
});
