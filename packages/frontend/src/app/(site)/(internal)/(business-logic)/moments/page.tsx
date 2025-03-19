import { FC } from 'react';
import Link from 'next/link';
import { UploadIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import Title from '@/components/ui/title';

const MomentsPage: FC = () => {
	return (
		<>
			<Title>Your Moments</Title>
			<Link href="/moments/upload">
				<Button variant="accent">
					<UploadIcon size={18} className="mr-2" /> Upload Moment
				</Button>
			</Link>
		</>
	);
};

export default MomentsPage;
