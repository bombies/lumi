/* eslint-disable import/extensions */
import { FC, PropsWithChildren } from 'react';

import Footer from '@/components/footer/footer';
import Header from '@/components/header';

const InternalLayout: FC<PropsWithChildren> = ({ children }) => {
	return (
		<>
			<Header />
			{children}
			<Footer />
		</>
	);
};

export default InternalLayout;
