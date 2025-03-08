import { trpc } from './api';
import { db } from './db';
import {
	authSecret,
	mailerHostSecret,
	mailerPasswordSecret,
	mailerPortSecret,
	mailerUserSecret,
} from './secrets';
import { contentBucket } from './storage';

export const frontend = new sst.aws.Nextjs('Frontend', {
	path: 'packages/frontend',
	dev: {
		command: 'bun run dev',
	},
	openNextVersion: '3.5.1',
	link: [
		trpc,
		contentBucket,
		db,
		mailerHostSecret,
		mailerPasswordSecret,
		mailerUserSecret,
		mailerPortSecret,
	],
	domain: $app.stage === 'production' ? 'lumi.ajani.me' : undefined,
	environment: {
		AUTH_SECRET: authSecret.value,
		NEXT_PUBLIC_TRPC_URL:
			$app.stage === 'production' ? 'https://api.lumi.ajani.me' : trpc.url,
		TABLE_NAME: db.name,
	},
});
