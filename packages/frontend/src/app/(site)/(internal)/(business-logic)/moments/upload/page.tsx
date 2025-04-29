import type { FC } from 'react';

import Title from '@/components/ui/title';
import MomentUploadContent from './components/moment-upload-content';

const MomentUploadPage: FC = () => {
	return (
		<>
			<Title>Share a Moment</Title>
			<MomentUploadContent />
		</>
	);
};

export default MomentUploadPage;
