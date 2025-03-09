'use client';

import { FC, useMemo } from 'react';
import { MoonIcon, SunIcon, SunMoonIcon } from 'lucide-react';

import { useColorScheme } from '@/components/providers/color-scheme-provider';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ColorSchemeToggle: FC = () => {
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
				<Button size="icon" variant="ghost">
					{schemeIcon}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-32">
				<DropdownMenuLabel>Colour Scheme</DropdownMenuLabel>
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
					checked={currentColorScheme === 'system'}
					onCheckedChange={checked => {
						if (checked) setCurrentColorScheme('system');
					}}
				>
					<SunMoonIcon /> System
				</DropdownMenuCheckboxItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default ColorSchemeToggle;
