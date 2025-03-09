import { FC, PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
	label: string;
	description?: string;
}>;

const Setting: FC<Props> = ({ children, label, description }) => {
	return (
		<div className="w-full flex gap-8">
			<div className="space-y-1 max-w-[50%]">
				<p className="max-w-72">{label}</p>
				{description && <p className="text-xs text-foreground/50">{description}</p>}
			</div>
			{children}
		</div>
	);
};

export default Setting;
