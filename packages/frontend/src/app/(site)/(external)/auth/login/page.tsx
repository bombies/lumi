import { FC } from 'react';
import { redirect } from 'next/navigation';

import ErrorHandler from '@/app/(site)/auth/components/error-handler';
import LoginForm from '@/app/(site)/auth/components/login-form';
import { auth } from '@/auth';

const LoginPage: FC = async () => {
	const session = await auth();
	if (session) redirect('/');

	return (
		<>
			<ErrorHandler />
			<LoginForm />
		</>
	);
};

export default LoginPage;
