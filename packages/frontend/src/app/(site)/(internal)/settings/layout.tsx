import type { FC, PropsWithChildren } from 'react';
import { SettingsIcon } from 'lucide-react';

import SettingsSidebar from '@/app/(site)/(internal)/settings/settings-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

const SettingsLayout: FC<PropsWithChildren> = ({ children }) => {
	return (
		<SidebarProvider>
			<SettingsSidebar />
			<SidebarInset>
				<p className="p-5 text-xs flex gap-1 text-secondary items-center">
					<SettingsIcon size={10} />
					{' '}
					Settings
				</p>
				<div className="px-2 laptop:p-6 flex">
					<SidebarTrigger />
					{' '}
					<main className="p-0 pb-24 laptop:pl-6 laptop:max-w-[55rem] w-full space-y-6">{children}</main>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
};

export default SettingsLayout;
