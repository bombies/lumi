import { FC } from 'react';
import Link from 'next/link';
import { UploadIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import Title from '@/components/ui/title';
import MomentsGrid from './components/moments-grid';

const MomentsPage: FC = () => {
	return (
		<>
			<Title>Your Moments</Title>
			<Link href="/moments/upload">
				<Button variant="accent" className="mb-6">
					<UploadIcon size={18} className="mr-2" /> Upload Moment
				</Button>
			</Link>
			<MomentsGrid />
		</>
	);
};

export default MomentsPage;
