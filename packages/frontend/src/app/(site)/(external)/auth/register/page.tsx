import { FC } from 'react';
import { redirect } from 'next/navigation';

import RegisterForm from '@/app/(site)/(external)/auth/components/register-form';
import { auth } from '@/auth';

const LoginPage: FC = async () => {
	const session = await auth();
	if (session) redirect('/');

	return <RegisterForm />;
};

export default LoginPage;
