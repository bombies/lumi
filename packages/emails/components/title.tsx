import type { ClassValue } from 'clsx';
import { Heading } from '@react-email/components';
import clsx from 'clsx';
import * as React from 'react';
import { twMerge } from 'tailwind-merge';

type Props = React.PropsWithChildren<{
	className?: string;
}>;

const Title: React.FC<Props> = ({ children, className }) => {
	return (
		<Heading className={cn('text-[#2A3322] font-bold text-[24px] p-0', className)}>
			{children}
		</Heading>
	);
};

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export default Title;
