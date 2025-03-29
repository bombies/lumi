'use client';

import { createContext, FC, PropsWithChildren, useContext, useEffect, useState } from 'react';

import { useLocalStorage } from '@/lib/hooks/useLocalStorage';

export type ColorScheme = 'light' | 'dark';

type ColorSchemeData = {
	currentColorScheme?: ColorScheme;
	setCurrentColorScheme: (colorScheme: ColorScheme | undefined) => void;
};

const ColorSchemeContext = createContext<ColorSchemeData | undefined>(undefined);

export const useColorScheme = () => {
	const context = useContext(ColorSchemeContext);
	if (!context) throw new Error('useColorScheme must be used within a ColorSchemeProvider');
	return context;
};

const ColorSchemeProvider: FC<PropsWithChildren> = ({ children }) => {
	const localStorage = useLocalStorage();
	const [currentColorScheme, setCurrentColorScheme] = useState<ColorScheme | undefined>();

	useEffect(() => {
		if (!localStorage) return;

		if (!currentColorScheme) {
			localStorage.removeItem('colorScheme');
		} else {
			localStorage.setItem('colorScheme', currentColorScheme);
		}
	}, [currentColorScheme, localStorage]);

	useEffect(() => {
		document.documentElement.classList.toggle(
			'dark',
			currentColorScheme === 'dark' ||
				(!localStorage?.hasKey('colorScheme') && window.matchMedia('(prefers-color-scheme: dark)').matches),
		);
	}, [currentColorScheme, localStorage]);

	useEffect(() => {
		const mediaList = window.matchMedia('(prefers-color-scheme: dark)');
		const changeHandler = (e: MediaQueryListEvent) => {
			document.documentElement.classList.toggle(
				'dark',
				currentColorScheme === 'dark' || (!localStorage?.hasKey('colorScheme') && e.matches),
			);
		};

		mediaList.addEventListener('change', changeHandler);

		return () => {
			mediaList.removeEventListener('change', changeHandler);
		};
	}, [currentColorScheme, localStorage]);

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
