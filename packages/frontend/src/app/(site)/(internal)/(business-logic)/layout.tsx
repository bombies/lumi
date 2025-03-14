import { FC, PropsWithChildren } from 'react';

import Footer from '@/components/footer/footer';
import Header from '@/components/header';

const BusinessLogicLayout: FC<PropsWithChildren> = ({ children }) => {
	return (
		<>
			<Header />
			<main className="pb-[100px] px-6 space-y-12 mt-18">{children}</main>
			<Footer />
		</>
	);
};

export default BusinessLogicLayout;
