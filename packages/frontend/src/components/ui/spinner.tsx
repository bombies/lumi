'use client';

import type { FC } from 'react';
import { motion } from 'motion/react';

import { cn } from '../../lib/utils';

type Props = {
	className?: string;
	size?: number;
	light?: boolean;
};

const Spinner: FC<Props> = ({ className, size, light }) => {
	return (
		<div className="flex justify-center items-center rounded-sm w-fit">
			<motion.div
				className={cn(
					'rounded-full border-2 border-t-primary will-change-transform',
					light && 'border-t-lime-100',
					className,
				)}
				style={{
					width: size,
					height: size,
				}}
				animate={{ rotate: 360 }}
				transition={{
					duration: 1.5,
					repeat: Infinity,
					ease: 'linear',
				}}
			/>
		</div>
	);
};

export default Spinner;
