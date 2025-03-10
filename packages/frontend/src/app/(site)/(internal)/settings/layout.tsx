import { FC, PropsWithChildren } from 'react';
import { SettingsIcon } from 'lucide-react';

import SettingsSidebar from '@/app/(site)/(internal)/settings/settings-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

const SettingsLayout: FC<PropsWithChildren> = ({ children }) => {
	return (
		<SidebarProvider>
			<SettingsSidebar />
			<SidebarInset>
				<p className="p-5 text-xs flex gap-1 text-secondary items-center">
					<SettingsIcon size={10} /> Settings
				</p>
				<div className="p-6 flex">
					<SidebarTrigger /> <main className="pl-6 w-full">{children}</main>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
};

export default SettingsLayout;
