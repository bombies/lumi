import type { FC } from 'react';
import RegisterForm from '@/app/(site)/(external)/auth/components/register-form';

import { getServerSession } from '@/lib/better-auth/auth-actions';
import { redirect } from 'next/navigation';
import ErrorHandler from '../components/error-handler';

const RegisterPage: FC = async () => {
	const session = await getServerSession();
	if (session) redirect('/');

	return (
		<>
			<ErrorHandler />
			<RegisterForm />
		</>
	);
};

export default RegisterPage;
