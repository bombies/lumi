import ErrorHandler from '@/app/(site)/auth/components/error-handler';
import RegisterForm from '@/app/(site)/auth/components/register-form';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { FC } from 'react';

const LoginPage: FC = async () => {
    const session = await auth();
	if (session) redirect('/');

	return (
		<main>
			<ErrorHandler />
			<RegisterForm />
		</main>
	);
};

export default LoginPage;
