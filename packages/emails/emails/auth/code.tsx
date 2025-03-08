import { sendReactEmail } from '@lumi/core/email/email.service';
import * as React from 'react';

import EmailTemplate from '../../components/template';

type Props = {
	code: string;
};

const AuthCodeEmail: React.FC<Props> = ({ code }) => {
	return <EmailTemplate>{code ?? 'email code'}</EmailTemplate>;
};

export const sendAuthCodeEmail = async ({
	email,
	code,
}: {
	email: string;
	code: string;
}) => {
	return sendReactEmail({
		to: email,
		subject: 'Your Lumi verification code',
		body: <AuthCodeEmail code={code} />,
	});
};

export default AuthCodeEmail;
