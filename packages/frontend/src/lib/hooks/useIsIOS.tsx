'use client';

import { useEffect, useState } from 'react';

import { useLocalStorage } from './useLocalStorage';

export const useIsIOS = () => {
	const storage = useLocalStorage();
	const [isIOS, setIsIOS] = useState(false);

	useEffect(() => {
		setIsIOS(() => {
			const val = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
			return val;
		});
	}, [storage]);

	return isIOS;
};
