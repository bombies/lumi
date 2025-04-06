import { FC } from 'react';

import Setting from '../components/setting';
import SettingsSection from '../components/settings-section';
import DeleteAccountButton from './components/delete-account-button';
import ResetPasswordButton from './components/reset-password-button';

const SecuritySettingsPage: FC = () => {
	return (
		<SettingsSection header="Your Account & Security">
			<Setting
				label="Reset Password"
				description="If you've forgotten your password or just want to have it changed, you can easily do so here."
			>
				<ResetPasswordButton />
			</Setting>
			<SettingsSection header="Danger Zone" destructive>
				<Setting
					label="Delete Account"
					description="This allows you to permanently delete your account and all of your data. If you are in a relationship, it will be deleted and your partner will no longer be in a relationship."
				>
					<DeleteAccountButton />
				</Setting>
			</SettingsSection>
		</SettingsSection>
	);
};

export default SecuritySettingsPage;
