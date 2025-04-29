import type { FC, PropsWithChildren } from 'react';

import { cn } from '@/lib/utils';

type Props = PropsWithChildren<{
	header: string;
	destructive?: boolean;
}>;

const SettingsSection: FC<Props> = ({ header, children, destructive }) => {
	return (
		<section
			className={cn(
				'space-y-6 w-full',
				destructive && 'bg-destructive/10 p-6 rounded-md border border-destructive border-dashed',
			)}
		>
			<h3 className="font-bold text-3xl">{header}</h3>
			{children}
		</section>
	);
};

export default SettingsSection;
