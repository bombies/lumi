'use client';

import { FC, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HeartIcon, LockClosedIcon, PaintBrushIcon, UserCircleIcon as UserIcon } from '@heroicons/react/24/outline';
import {
	HeartIcon as HeartFilledIcon,
	HomeIcon,
	LockClosedIcon as LockClosedFilledIcon,
	PaintBrushIcon as PaintBrushFilledIcon,
	UserCircleIcon as UserFilledIcon,
} from '@heroicons/react/24/solid';
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
	useSidebar,
} from '@/components/ui/sidebar';
import SignOutButton from '@/components/ui/sign-out-button';
import { GetRelationship } from '@/hooks/trpc/relationship-hooks';

type SidebarItem = {
	groupLabel: string;
	items: {
		title: string;
		url: string;
		icon: IconType;
		filledIcon?: IconType;
	}[];
};

type GetItemsArgs = {
	withRelationship?: boolean;
};

const items: (args?: GetItemsArgs) => SidebarItem[] = args => {
	const res: SidebarItem[] = [
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

	if (args?.withRelationship)
		res.push({
			groupLabel: 'Relationship Settings',
			items: [
				{
					title: 'Your Relationship',
					url: '/settings/relationship',
					icon: HeartIcon,
					filledIcon: HeartFilledIcon,
				},
			],
		});

	return res;
};

const SettingsSidebar: FC = () => {
	const { data: relationship } = GetRelationship();
	const { open } = useSidebar();
	const pathName = usePathname();
	const itemIsActive = useCallback(
		(url: string) =>
			url === '/settings' ? pathName === '/settings' : pathName.toLowerCase().startsWith(url.toLowerCase()),
		[pathName],
	);

	const itemElements = useMemo(
		() =>
			items({ withRelationship: !!relationship }).map(group => {
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
			}),
		[itemIsActive, relationship],
	);

	return (
		<Sidebar variant="inset" collapsible="icon">
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
				<SignOutButton iconOnly={!open} />
			</SidebarFooter>
		</Sidebar>
	);
};

export default SettingsSidebar;
