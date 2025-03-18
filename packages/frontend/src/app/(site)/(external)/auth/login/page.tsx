import { FC } from 'react';
import { redirect } from 'next/navigation';

import ErrorHandler from '@/app/(site)/(external)/auth/components/error-handler';
import LoginForm from '@/app/(site)/(external)/auth/components/login-form';
import { getServerSession } from '@/lib/supabase/server';

const LoginPage: FC = async () => {
	const session = await getServerSession();
	if (session) redirect('/');

	return (
		<>
			<ErrorHandler />
			<LoginForm />
		</>
	);
};

export default LoginPage;
