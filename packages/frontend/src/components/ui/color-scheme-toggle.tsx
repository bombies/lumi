'use client';

import type { FC, PropsWithChildren } from 'react';
import { Button } from '@/components/ui/button';

import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useColorSchemeAPI } from '@/lib/hooks/useColorSchemeAPI';
import { MoonIcon, SunIcon, SunMoonIcon } from 'lucide-react';

const ColorSchemeToggle: FC<PropsWithChildren> = ({ children }) => {
	const { currentColorScheme, setCurrentColorScheme, schemeIcon } = useColorSchemeAPI();

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
					onCheckedChange={(checked) => {
						if (checked) setCurrentColorScheme('light');
					}}
				>
					<SunIcon />
					{' '}
					Light
				</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem
					checked={currentColorScheme === 'dark'}
					onCheckedChange={(checked) => {
						if (checked) setCurrentColorScheme('dark');
					}}
				>
					<MoonIcon />
					{' '}
					Dark
				</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem
					checked={currentColorScheme === undefined}
					onCheckedChange={(checked) => {
						if (checked) setCurrentColorScheme(undefined);
					}}
				>
					<SunMoonIcon />
					{' '}
					System
				</DropdownMenuCheckboxItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default ColorSchemeToggle;
