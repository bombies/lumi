import { FC } from 'react';

import Setting from '@/app/(site)/(internal)/settings/components/setting';
import SettingsSection from '@/app/(site)/(internal)/settings/components/settings-section';
import ColorSchemeToggle from '@/components/ui/color-scheme-toggle';

const AppearanceSettingsPage: FC = () => {
	return (
		<SettingsSection header="Appearance">
			<Setting label="Colour Scheme" description="Change the colour scheme of the site.">
				<ColorSchemeToggle />
			</Setting>
		</SettingsSection>
	);
};

export default AppearanceSettingsPage;
