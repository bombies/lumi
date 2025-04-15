import { FC } from 'react';
import { redirect } from 'next/navigation';

import RegisterForm from '@/app/(site)/(external)/auth/components/register-form';
import { getServerSession } from '@/lib/better-auth/auth-actions';
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
