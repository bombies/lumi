import { FC, PropsWithChildren } from 'react';

import Footer from '@/components/footer/footer';
import Header from '@/components/header';

const InternalLayout: FC<PropsWithChildren> = ({ children }) => {
	return (
		<>
			<Header />
			<div className="pb-[100px]">{children}</div>
			<Footer />
		</>
	);
};

export default InternalLayout;
