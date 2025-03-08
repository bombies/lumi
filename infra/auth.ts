import { db } from './db';
import {
	mailerHostSecret,
	mailerPasswordSecret,
	mailerPortSecret,
	mailerUserSecret,
} from './secrets';

export const auth = new sst.aws.Auth('AuthServer', {
	issuer: {
		handler: 'packages/functions/auth/index.handler',
		link: [
			db,
			mailerHostSecret,
			mailerPasswordSecret,
			mailerUserSecret,
			mailerPortSecret,
		],
	},
	domain: $app.stage === 'production' ? 'auth.lumi.ajani.me' : undefined,
});
