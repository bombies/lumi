import { SupabaseEmailHookPayload } from '@lumi/core/types/supabase.types';
import { sendSignUpEmail } from '@lumi/emails/auth/sign-up-email';
import { APIGatewayProxyEvent, Handler } from 'aws-lambda';
import { Resource } from 'sst';
import { Webhook } from 'standardwebhooks';

export const handler: Handler<APIGatewayProxyEvent> = async event => {
	const headers = Object.fromEntries(Object.entries(event.headers));
	try {
		const wh = new Webhook(Resource.SupabaseSendEmailHookSecret.value);
		const {
			user,
			email_data: { token_hash, email_action_type },
			// @ts-expect-error Request has the headers needed
		} = wh.verify(event.body!, headers) as SupabaseEmailHookPayload;

		switch (email_action_type) {
			case 'signup':
				await sendSignUpEmail({
					email: user.email,
					tokenHash: token_hash,
					siteUrl: process.env.CANONICAL_URL || 'https://localhost:3000',
				});
				break;
			default:
				console.error(`This action type (${email_action_type}) is not supported by the webhook handler yet!`);
				break;
		}
	} catch (e) {
		console.error(e);
		return {
			statusCode: 401,
			body: JSON.stringify({ message: 'Failed to send email' }),
		};
	}

	return {
		statusCode: 200,
		body: JSON.stringify({ message: 'Email sent successfully' }),
	};
};
