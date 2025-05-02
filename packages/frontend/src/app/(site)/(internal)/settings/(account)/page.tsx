import type { FC } from 'react';

import SettingsSection from '../components/settings-section';
import UserProfileSettings from './components/user-profile-settings';

const SettingsPage: FC = () => {
	return (
		<SettingsSection header="Your Profile">
			<UserProfileSettings />
		</SettingsSection>
	);
};

export default SettingsPage;
