import { FC, PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
	header: string;
}>;

const SettingsSection: FC<Props> = ({ header, children }) => {
	return (
		<section className="space-y-6 w-full">
			<h3 className="font-bold text-3xl">{header}</h3>
			{children}
		</section>
	);
};

export default SettingsSection;
