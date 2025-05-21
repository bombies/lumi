import type { FC } from 'react';
import { redirect } from 'next/navigation';

import ErrorHandler from '@/app/(site)/(external)/auth/components/error-handler';
import LoginForm from '@/app/(site)/(external)/auth/components/login-form';
import { getServerSession } from '@/lib/better-auth/auth-actions';

const LoginPage: FC = async () => {
	const session = await getServerSession();
	if (session?.user) {
		if (!session.user.emailVerified) redirect('/auth/register/confirm');
		else redirect('/');
	}

	return (
		<>
			<ErrorHandler />
			<LoginForm />
		</>
	);
};

export default LoginPage;
