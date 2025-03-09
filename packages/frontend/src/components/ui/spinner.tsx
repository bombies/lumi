import { FC } from 'react';
import { LoaderCircleIcon } from 'lucide-react';

import { cn } from '../../lib/utils';

type Props = {
	className?: string;
	size?: number;
};

const Spinner: FC<Props> = ({ className, size }) => {
	return <LoaderCircleIcon size={size} className={cn('animate-spin', className)} />;
};

export default Spinner;
