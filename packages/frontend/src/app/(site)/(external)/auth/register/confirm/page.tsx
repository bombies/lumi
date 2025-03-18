import { FC } from 'react';
import { redirect } from 'next/navigation';

import { getServerSession } from '@/lib/supabase/server';

const RegisterConfirmPage: FC = async () => {
	const session = await getServerSession();
	if (session) redirect('/');

	return (
		<>
			<h3 className="font-bold text-4xl">You have successfully registered!</h3>
			<p>Check your email for a confirmation link. It will expire in 10 minutes.</p>
		</>
	);
};

export default RegisterConfirmPage;
