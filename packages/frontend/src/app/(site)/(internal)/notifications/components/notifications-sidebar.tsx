'use client';

import { FC, useMemo } from 'react';
import Link from 'next/link';
import { HomeIcon } from '@heroicons/react/24/solid';
import { IconType } from '@icons-pack/react-simple-icons';

import { Button } from '@/components/ui/button';
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
} from '@/components/ui/sidebar';
import { useNotificationsView } from './notifications-view-provider';

type SidebarItem = {
	groupLabel: string;
	items: {
		selected: boolean;
		title: string;
		onClick: () => void;
		icon?: IconType;
		filledIcon?: IconType;
	}[];
};
const NotificationsSidebar: FC = () => {
	const {
		filter: { currentFilter, setFilter },
	} = useNotificationsView();

	const items = useMemo<SidebarItem[]>(
		() => [
			{
				groupLabel: 'Notification Filters',
				items: [
					{
						selected: currentFilter === undefined,
						title: 'All Notifications',
						onClick: () => setFilter(undefined),
					},
					{
						selected: currentFilter === 'unread',
						title: 'Unread',
						onClick: () => setFilter('unread'),
					},
					{
						selected: currentFilter === 'read',
						title: 'Read',
						onClick: () => setFilter('read'),
					},
				],
			},
		],
		[currentFilter, setFilter],
	);

	const itemElements = useMemo(
		() =>
			items.map(group => {
				return (
					<SidebarGroup key={group.groupLabel}>
						<SidebarGroupLabel>{group.groupLabel}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{group.items.map(item => (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton
											asChild
											isActive={item.selected}
											className="hover:bg-accent/50 cursor-pointer"
											onClick={item.onClick}
										>
											<div>
												{item.icon && <item.icon />}
												<span>{item.title}</span>
											</div>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				);
			}),
		[items],
	);

	return (
		<Sidebar>
			<SidebarHeader>
				<Link href="/">
					<h1 className="font-cursive text-xl text-center">Lumi</h1>
				</Link>
			</SidebarHeader>
			<SidebarContent>{itemElements}</SidebarContent>
			<SidebarFooter>
				<Link href="/home">
					<Button className="w-full">
						<HomeIcon className="size-[18px]" /> Go Home
					</Button>
				</Link>
			</SidebarFooter>
		</Sidebar>
	);
};

export default NotificationsSidebar;
