import { FC } from 'react';

import SettingsSection from '../components/settings-section';
import RelationshipSettingsContent from './relationship-settings-content';

const RelationshipSettingsPage: FC = async () => {
	return (
		<SettingsSection header="Your Relationship">
			<RelationshipSettingsContent />
		</SettingsSection>
	);
};

export default RelationshipSettingsPage;
