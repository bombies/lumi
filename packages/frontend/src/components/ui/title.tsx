import type { FC, PropsWithChildren } from 'react';

import { cn } from '@/lib/utils';

type Props = PropsWithChildren<{
	className?: string;
}>;

const Title: FC<Props> = ({ children, className }) => {
	return <h1 className={cn('font-bold text-5xl', className)}>{children}</h1>;
};

export default Title;
