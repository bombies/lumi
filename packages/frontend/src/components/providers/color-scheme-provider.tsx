'use client';

import { createContext, FC, PropsWithChildren, useContext, useEffect, useState } from 'react';

// eslint-disable-next-line import/extensions
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';

export type ColorScheme = 'light' | 'dark' | 'system';

type ColorSchemeData = {
	currentColorScheme?: ColorScheme;
	setCurrentColorScheme: (colorScheme: ColorScheme) => void;
};

const ColorSchemeContext = createContext<ColorSchemeData | undefined>(undefined);

export const useColorScheme = () => {
	const context = useContext(ColorSchemeContext);
	if (!context) throw new Error('useColorScheme must be used within a ColorSchemeProvider');
	return context;
};

const ColorSchemeProvider: FC<PropsWithChildren> = ({ children }) => {
	const localStorage = useLocalStorage();
	const [currentColorScheme, setCurrentColorScheme] = useState<ColorScheme>();

	useEffect(() => {
		if (!localStorage) return;

		if (!currentColorScheme) {
			const storedColorScheme = localStorage.getItem<ColorScheme>('colorScheme');
			setCurrentColorScheme(storedColorScheme || 'system');
		} else {
			localStorage.setItem('colorScheme', currentColorScheme);
		}
	}, [currentColorScheme, localStorage]);

	useEffect(() => {
		document.documentElement.classList.toggle(
			'dark',
			currentColorScheme === 'dark' ||
				(currentColorScheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches),
		);
	}, [currentColorScheme]);

	return (
		<ColorSchemeContext.Provider
			value={{
				currentColorScheme,
				setCurrentColorScheme,
			}}
		>
			{children}
		</ColorSchemeContext.Provider>
	);
};

export default ColorSchemeProvider;
