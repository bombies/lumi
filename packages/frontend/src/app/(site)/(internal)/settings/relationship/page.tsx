import { FC, Suspense } from 'react';

import SettingsSection from '../components/settings-section';
import MusicSharingSettingsContent from './components/music-sharing-settings-content';
import RelationshipSettingsContent from './components/relationship-settings-content';

const RelationshipSettingsPage: FC = async () => {
	return (
		<>
			<SettingsSection header="Your Relationship">
				<RelationshipSettingsContent />
			</SettingsSection>
			<SettingsSection header="Music Sharing">
				<Suspense fallback={<p>music sharing content loading</p>}>
					<MusicSharingSettingsContent />
				</Suspense>
			</SettingsSection>
		</>
	);
};

export default RelationshipSettingsPage;
