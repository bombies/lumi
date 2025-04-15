'use client';

import { useMemo } from 'react';
import { MoonIcon, SunIcon, SunMoonIcon } from 'lucide-react';

import { useColorScheme } from '@/components/providers/color-scheme-provider';

export const useColorSchemeAPI = () => {
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

	return {
		currentColorScheme,
		setCurrentColorScheme,
		schemeIcon,
	};
};
