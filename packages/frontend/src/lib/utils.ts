import { InfiniteData } from '@lumi/core/types/infinite-data.dto';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const flattenPages = <T>(pages?: InfiniteData<T>[]): T[] => {
	return pages?.flatMap(page => page.data) ?? [];
};
