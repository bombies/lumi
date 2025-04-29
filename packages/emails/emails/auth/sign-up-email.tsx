import { sendReactEmail } from '@lumi/core/email/email.service';
import { Button, Text } from '@react-email/components';
import * as React from 'react';

import EmailTemplate from '../../components/template';

export type SignUpEmailProps = {
	siteUrl: string;
	email: string;
};

const SignUpEmail: React.FC<SignUpEmailProps> = ({ siteUrl }) => {
	return (
		<EmailTemplate preview="Welcome to Lumi! Please confirm your account by clicking the link">
			<Text>Hey,</Text>
			<Text>Welcome to Lumi! Please confirm your account by clicking the link below:</Text>
			<Button className="bg-[#76A34E] text-[#F8FFF1] px-4 py-2 rounded-lg cursor-pointer" href={siteUrl}>
				Confirm your account
			</Button>
			<Text className="text-neutral-400">If you didn&apos;t try to login, you can safely ignore this email.</Text>
		</EmailTemplate>
	);
};

export const sendSignUpEmail = async ({ email, siteUrl }: SignUpEmailProps) => {
	return sendReactEmail({
		to: email,
		subject: 'Confirm Your Lumi Account',
		body: <SignUpEmail siteUrl={siteUrl} email={email} />,
	});
};

export default SignUpEmail;
