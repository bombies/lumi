import type { FC } from 'react';
import { getServerSession } from '@/lib/better-auth/auth-actions';

import { redirect } from 'next/navigation';
import SignOutText from './sign-out-text';

const RegisterConfirmPage: FC = async () => {
	const session = await getServerSession();
	if (!session) return redirect('/auth/login');
	if (session?.user.emailVerified) redirect('/');

	return (
		<>
			<h3 className="font-bold text-4xl text-center">You have successfully registered!</h3>
			<p className="text-center">Check your email for a confirmation link. It will expire in 1 hour.</p>
			<p className="max-w-sm text-center border border-primary border-dashed p-6 rounded-md bg-primary/10">
				Confirmed your account but stuck on this page? Your session might be out-of-date.
				{' '}
				<SignOutText />
				{' '}
				and
				re-enter your credentials to update your session.
			</p>
		</>
	);
};

export default RegisterConfirmPage;
