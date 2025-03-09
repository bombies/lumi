/* eslint-disable import/extensions */
import { FC } from 'react';
import { BellIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const NotificationButton: FC = () => {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button size="icon" variant="ghost">
					<BellIcon size={18} />
				</Button>
			</PopoverTrigger>
			<PopoverContent></PopoverContent>
		</Popover>
	);
};

export default NotificationButton;
