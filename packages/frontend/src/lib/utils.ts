import type { InfiniteData } from '@lumi/core/types/infinite-data.dto';
import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const flattenPages = <T>(pages?: InfiniteData<T>[]): T[] => {
	return pages?.flatMap(page => page.data) ?? [];
};
