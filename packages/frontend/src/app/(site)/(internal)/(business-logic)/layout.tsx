import { FC, PropsWithChildren } from 'react';

import Footer from '@/components/footer/footer';
import Header from '@/components/header/header';
import ContentContainer from './components/content-container';

const BusinessLogicLayout: FC<PropsWithChildren> = async ({ children }) => {
	return (
		<>
			<Header />
			<ContentContainer>{children}</ContentContainer>
			<Footer />
		</>
	);
};

export default BusinessLogicLayout;
