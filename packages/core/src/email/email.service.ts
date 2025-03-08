import { render } from '@react-email/components';
import nodemailer from 'nodemailer';
import { ReactElement } from 'react';
import { Resource } from 'sst';

export const mailTransporter = nodemailer.createTransport({
	host: Resource.MailerHost.value,
	port: parseInt(Resource.MailerPort.value),
	secure: true,
	auth: {
		user: Resource.MailerUser.value,
		pass: Resource.MailerPassword.value,
	},
});

type SendReactEmailArgs = {
	to: string;
	subject: string;
	body: ReactElement;
};

export const sendReactEmail = async ({ to, subject, body }: SendReactEmailArgs) => {
	return await mailTransporter.sendMail({
		from: `Lumi <noreply-lumi@ajani.me>`,
		to,
		subject,
		html: await render(body),
	});
};
