'use client';

import { FC, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LockClosedIcon, PaintBrushIcon, UserCircleIcon as UserIcon } from '@heroicons/react/24/outline';
import {
	LockClosedIcon as LockClosedFilledIcon,
	PaintBrushIcon as PaintBrushFilledIcon,
	UserCircleIcon as UserFilledIcon,
} from '@heroicons/react/24/solid';
import { IconType } from '@icons-pack/react-simple-icons';

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '@/components/ui/sidebar';
import SignOutButton from '@/components/ui/sign-out-button';

type SidebarItem = {
	groupLabel: string;
	items: {
		title: string;
		url: string;
		icon: IconType;
		filledIcon?: IconType;
	}[];
};

const items: SidebarItem[] = [
	{
		groupLabel: 'Account Settings',
		items: [
			{
				title: 'Account',
				url: '/settings',
				icon: UserIcon,
				filledIcon: UserFilledIcon,
			},
			{
				title: 'Security',
				url: '/settings/security',
				icon: LockClosedIcon,
				filledIcon: LockClosedFilledIcon,
			},
		],
	},
	{
		groupLabel: 'Relationship Settings',
		items: [],
	},
	{
		groupLabel: 'Appearance & Accessibility',
		items: [
			{
				title: 'Appearance',
				url: '/settings/appearance',
				icon: PaintBrushIcon,
				filledIcon: PaintBrushFilledIcon,
			},
		],
	},
];

const SettingsSidebar: FC = () => {
	const { open } = useSidebar();
	const pathName = usePathname();
	const itemIsActive = useCallback(
		(url: string) =>
			url === '/settings' ? pathName === '/settings' : pathName.toLowerCase().startsWith(url.toLowerCase()),
		[pathName],
	);

	return (
		<Sidebar variant="inset" collapsible="icon">
			<SidebarHeader>
				<Link href="/">
					<h1 className="font-cursive text-xl text-center">Lumi</h1>
				</Link>
			</SidebarHeader>
			<SidebarContent>
				{items.map(group => {
					return (
						<SidebarGroup key={group.groupLabel}>
							<SidebarGroupLabel>{group.groupLabel}</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									{group.items.map(item => (
										<SidebarMenuItem key={item.title}>
											<SidebarMenuButton
												asChild
												isActive={itemIsActive(item.url)}
												className="hover:bg-accent/50"
											>
												<Link href={item.url}>
													{itemIsActive(item.url) && item.filledIcon ? (
														<item.filledIcon />
													) : (
														<item.icon />
													)}
													<span>{item.title}</span>
												</Link>
											</SidebarMenuButton>
										</SidebarMenuItem>
									))}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					);
				})}
			</SidebarContent>
			<SidebarFooter>
				<SignOutButton iconOnly={!open} />
			</SidebarFooter>
		</Sidebar>
	);
};

export default SettingsSidebar;
