/* eslint-disable import/extensions */
import { FC } from 'react';
import { redirect } from 'next/navigation';

import { getUserBySession } from '@/lib/server-utils';

const HomePage: FC = async () => {
	const user = await getUserBySession();
	if (!user) redirect('/auth/login');

	return (
		<main className="px-6">
			<h1 className="font-bold text-5xl mt-32">
				hey <span className="text-primary">{user.firstName}</span>
			</h1>
			<h3 className="text-2xl font-light">welcome back to your space</h3>
		</main>
	);
};

export default HomePage;
