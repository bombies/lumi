import { webDNS } from './dns';
import {
	mailerHostSecret,
	mailerPasswordSecret,
	mailerPortSecret,
	mailerUserSecret,
	supabaseSendEmailHookSecret,
} from './secrets';

export const emailSender = new sst.aws.Function('EmailSender', {
	handler: 'packages/functions/email/sender.handler',
	link: [mailerHostSecret, mailerPasswordSecret, mailerUserSecret, mailerPortSecret, supabaseSendEmailHookSecret],
	url: true,
	environment: {
		CANONICAL_URL: !$dev ? `https://${webDNS}` : 'https://localhost:3000',
	},
});
