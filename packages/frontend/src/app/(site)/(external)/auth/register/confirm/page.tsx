import { FC } from 'react';
import { redirect } from 'next/navigation';

import { getServerSession } from '@/lib/better-auth/auth-actions';

const RegisterConfirmPage: FC = async () => {
	const session = await getServerSession();
	if (session?.user.emailVerified) redirect('/');

	return (
		<>
			<h3 className="font-bold text-4xl">You have successfully registered!</h3>
			<p>Check your email for a confirmation link. It will expire in 10 minutes.</p>
		</>
	);
};

export default RegisterConfirmPage;
