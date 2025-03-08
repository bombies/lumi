import { subjects } from '@lumi/core/auth/subjects';
import { sendReactEmail } from '@lumi/core/email/email.service';
import { createUser, getUserByEmail } from '@lumi/core/users/users.service';
import AuthCodeEmail from '@lumi/emails/auth/code';
import { issuer } from '@openauthjs/openauth';
import { PasswordProvider } from '@openauthjs/openauth/provider/password';
import { DynamoStorage } from '@openauthjs/openauth/storage/dynamo';
import { PasswordUI } from '@openauthjs/openauth/ui/password';
import { Theme } from '@openauthjs/openauth/ui/theme';
import { handle } from 'hono/aws-lambda';
import * as React from 'react';
import { Resource } from 'sst';

import { PasswordLoginPage } from './login';

export const authTheme = {
	title: 'Lumi',
	radius: 'lg',
	primary: '#76A34E',
	background: {
		light: '#F8FFF1',
		dark: '10130D',
	},
} as const satisfies Theme;

const app = issuer({
	theme: authTheme,
	subjects,
	storage: DynamoStorage({
		table: Resource.Database.name,
		pk: 'pk',
		sk: 'sk',
	}),
	allow: process.env.NODE_ENV === 'development' ? async () => true : undefined,
	providers: {
		password: PasswordProvider(
			// PasswordUI({
			// 	async sendCode(email, code) {
			// 		console.log('send code', email, code);
			// 		sendReactEmail({
			// 			to: email,
			// 			subject: 'Your Lumi verification code',
			// 			body: <AuthCodeEmail code={code} />,
			// 		});
			// 	},
			// }),
			{
				async login(req, form, error) {
					const jsx = <PasswordLoginPage />;
					
				},
			},
		),
	},
	success: async (ctx, value) => {
		if (value.provider === 'password') {
			let user = await getUserByEmail(value.email);
			if (!user) {
				user = await createUser({
					email: value.email,
					username: 'test',
					firstName: 'test',
					lastName: 'test',
				});
			}

			console.log(user);

			return ctx.subject('user', {
				id: user.id,
				email: user.email,
				username: user.username,
			});
		}
		throw new Error('Invalid provider');
	},
});

export const handler = handle(app);
