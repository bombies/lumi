import { trpc } from './api';
import { auth } from './auth';
import { db } from './db';
import {
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
		auth,
		mailerHostSecret,
		mailerPasswordSecret,
		mailerUserSecret,
		mailerPortSecret,
	],
	domain: $app.stage === 'production' ? 'lumi.ajani.me' : undefined,
});
