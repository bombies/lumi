import type { FC } from 'react';

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import NotificationsSidebar from './components/notifications-sidebar';
import NotificationsTable from './components/notifications-table';
import NotificationsTitle from './components/notifications-title';
import NotificationsViewProvider from './components/notifications-view-provider';

const NotificationsPage: FC = () => {
	return (
		<NotificationsViewProvider>
			<SidebarProvider>
				<NotificationsSidebar />
				<main className="px-2 py-24 phone-big:px-12 tablet:pl-6 tablet:pr-0 w-full space-y-6">
					<SidebarTrigger />
					<NotificationsTitle />
					<NotificationsTable />
				</main>
			</SidebarProvider>
		</NotificationsViewProvider>
	);
};

export default NotificationsPage;
