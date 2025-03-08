import ErrorHandler from '@/app/(site)/auth/components/error-handler';
import LoginForm from '@/app/(site)/auth/components/login-form';
import { auth } from '@/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FC } from 'react';

const LoginPage: FC = async () => {
	const session = await auth();
	if (session) redirect('/');

	return (
		<main>
			<ErrorHandler />
			<LoginForm />
			<Link href="/auth/register">Create an account</Link>
		</main>
	);
};

export default LoginPage;
