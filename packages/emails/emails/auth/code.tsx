import * as React from 'react';

import EmailTemplate from '../../components/template';

type Props = {
	code: string;
};

const AuthCodeEmail: React.FC<Props> = ({ code }) => {
	return <EmailTemplate>{code ?? 'email code'}</EmailTemplate>;
};

export default AuthCodeEmail;
