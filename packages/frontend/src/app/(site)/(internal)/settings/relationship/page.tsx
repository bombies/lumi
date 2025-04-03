import { FC, Suspense } from 'react';

import SettingsSection from '../components/settings-section';
import LeaveRelationshipButton from './components/leave-relationship-button';
import MusicSharingSettingsContent from './components/music-sharing/music-sharing-settings-content';
import MusicSharingSettingsSkeleton from './components/music-sharing/music-sharing-settings-skeleton';
import RelationshipSettingsContent from './components/relationship-settings-content';

const RelationshipSettingsPage: FC = async () => {
	return (
		<>
			<SettingsSection header="Your Relationship">
				<RelationshipSettingsContent />
			</SettingsSection>
			<SettingsSection header="Music Sharing">
				<Suspense fallback={<MusicSharingSettingsSkeleton />}>
					<MusicSharingSettingsContent />
				</Suspense>
			</SettingsSection>
			<SettingsSection header="Danger Zone" destructive>
				<LeaveRelationshipButton />
			</SettingsSection>
		</>
	);
};

export default RelationshipSettingsPage;
