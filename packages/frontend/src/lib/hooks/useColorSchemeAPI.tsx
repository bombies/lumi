'use client';

import { useColorScheme } from '@/components/providers/color-scheme-provider';
import { MoonIcon, SunIcon, SunMoonIcon } from 'lucide-react';

import { useMemo } from 'react';

export const useColorSchemeAPI = () => {
	const { currentColorScheme, setCurrentColorScheme } = useColorScheme();

	const schemeIcon = useMemo(
		() =>
			currentColorScheme === 'light'
				? (
						<SunIcon />
					)
				: currentColorScheme === 'dark'
					? (
							<MoonIcon />
						)
					: (
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
