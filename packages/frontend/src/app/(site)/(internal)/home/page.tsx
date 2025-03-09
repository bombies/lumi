/* eslint-disable import/extensions */
import { FC } from 'react';

import SignOutButton from '@/components/ui/sign-out-button';

const HomePage: FC = () => {
	return (
		<main>
			welcome to lumi :) <SignOutButton />
		</main>
	);
};

export default HomePage;
