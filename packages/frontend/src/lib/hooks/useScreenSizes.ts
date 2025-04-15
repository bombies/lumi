'use client';

import { useMediaQuery } from '@uidotdev/usehooks';

export const useIsPhone = () => {
	return useMediaQuery('only screen and (max-width: 768px)');
};

export const useIsBigPhone = () => {
	return useMediaQuery('only screen and (max-width: 1024px)');
};

export const useIsTablet = () => {
	return useMediaQuery('only screen and (max-width: 1280px)');
};

export const useIsLaptop = () => {
	return useMediaQuery('only screen and (max-width: 1440px)');
};

export const useIsBigLaptop = () => {
	return useMediaQuery('only screen and (max-width: 1920px)');
};

export const useIsDesktop = () => {
	return useMediaQuery('only screen and (min-width: 1921px)');
};
