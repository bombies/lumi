'use client';

import { FC } from 'react';
import Link from 'next/link';
import { HeartIcon, LockClosedIcon, PaintBrushIcon, UserCircleIcon, UserIcon } from '@heroicons/react/24/solid';
import { LogOutIcon, MoonIcon, SunIcon, SunMoonIcon } from 'lucide-react';

import { useColorSchemeAPI } from '@/lib/hooks/useColorSchemeAPI';
import { useSignOut } from '@/lib/hooks/useSignOut';
import { useRelationship } from '../providers/relationships/relationship-provder';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import UserAvatar from '../ui/user-avatar';

const UserProfileButton: FC = () => {
	const { self } = useRelationship();
	const signOut = useSignOut();
	const { currentColorScheme, setCurrentColorScheme, schemeIcon } = useColorSchemeAPI();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button className="cursor-pointer size-[32px] flex items-center justify-center rounded-full border-2 border-primary">
					{self.avatarUrl ? (
						<UserAvatar user={self} className="size-full border-0" hideStatus />
					) : (
						<UserCircleIcon className="size-full" />
					)}
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56">
				<DropdownMenuLabel>My Account</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem asChild>
						<Link href="/settings">
							<UserIcon className="size-[16px] text-current" /> Profile
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link href="/settings/security">
							<LockClosedIcon className="size-[16px] text-current" /> Account &amp; Security
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link href="/settings/relationship">
							<HeartIcon className="size-[16px] text-current" /> Relationship
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link href="/settings/apprearance">
							<PaintBrushIcon className="size-[16px] text-current" /> Appearance
						</Link>
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>{schemeIcon} Colour Scheme</DropdownMenuSubTrigger>
						<DropdownMenuPortal>
							<DropdownMenuSubContent>
								<DropdownMenuCheckboxItem
									checked={currentColorScheme === 'light'}
									onCheckedChange={checked => {
										if (checked) setCurrentColorScheme('light');
									}}
								>
									<SunIcon /> Light
								</DropdownMenuCheckboxItem>
								<DropdownMenuCheckboxItem
									checked={currentColorScheme === 'dark'}
									onCheckedChange={checked => {
										if (checked) setCurrentColorScheme('dark');
									}}
								>
									<MoonIcon /> Dark
								</DropdownMenuCheckboxItem>
								<DropdownMenuCheckboxItem
									checked={currentColorScheme === undefined}
									onCheckedChange={checked => {
										if (checked) setCurrentColorScheme(undefined);
									}}
								>
									<SunMoonIcon /> System
								</DropdownMenuCheckboxItem>
							</DropdownMenuSubContent>
						</DropdownMenuPortal>
					</DropdownMenuSub>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuLabel className="text-destructive">Danger Zone</DropdownMenuLabel>
					<DropdownMenuItem variant="destructive" onClick={signOut}>
						<LogOutIcon className="size-[16px] text-current" /> Sign Out
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default UserProfileButton;
