'use client';

import { FC, PropsWithChildren, useMemo } from 'react';
import { MoonIcon, SunIcon, SunMoonIcon } from 'lucide-react';

import { useColorScheme } from '@/components/providers/color-scheme-provider';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ColorSchemeToggle: FC<PropsWithChildren> = ({ children }) => {
	const { currentColorScheme, setCurrentColorScheme } = useColorScheme();

	const schemeIcon = useMemo(
		() =>
			currentColorScheme === 'light' ? (
				<SunIcon />
			) : currentColorScheme === 'dark' ? (
				<MoonIcon />
			) : (
				<SunMoonIcon />
			),
		[currentColorScheme],
	);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				{children ?? (
					<Button size="icon" variant="ghost">
						{schemeIcon}
					</Button>
				)}
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-32">
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
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default ColorSchemeToggle;
