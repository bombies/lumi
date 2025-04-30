import { v4 as uuidv4 } from 'uuid';

export const getUUID = () => {
	return uuidv4();
};

export const chunkArray = <T>(array: T[], chunkSize: number = 25) => {
	const chunkedArray: T[][] = [];
	for (let i = 0; i < array.length; i += chunkSize) {
		chunkedArray.push(array.slice(i, i + chunkSize));
	}
	return chunkedArray;
};

export const substituteVariables = (str: string, variables: Record<string, string>) => {
	return str.replace(/\{(\w+)\}/g, (match, key) => variables[key] || match);
};

export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Deeply merges two objects, with values from the second object overwriting the first
 * @param target The base object to merge into
 * @param source The object whose properties will override the target
 * @returns A new merged object
 */
export function deepMerge<T extends object>(target: T, source: DeepPartial<T>): T {
	// Create a new object to avoid mutating the originals
	const output = { ...target };

	// If source is null or not an object, return target
	if (!source || typeof source !== 'object') {
		return output;
	}

	// Iterate through all properties of source
	Object.keys(source).forEach((key) => {
		const targetValue = output[key as keyof T];
		const sourceValue = source[key as keyof T];

		if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
			// If both values are arrays, merge them
			(output[key as keyof T] as any) = [...targetValue, ...sourceValue];
		} else if (
			sourceValue !== null
			&& typeof sourceValue === 'object'
			&& targetValue !== null
			&& typeof targetValue === 'object'
			&& !Array.isArray(sourceValue)
			&& !Array.isArray(targetValue)
		) {
			// If both values are objects, recursively merge them
			(output[key as keyof T] as any) = deepMerge(
				targetValue as object,
				sourceValue as object,
			);
		} else if (sourceValue !== undefined) {
			// For all other cases, if source value exists, use it
			(output[key as keyof T] as any) = sourceValue;
		}
	});

	return output;
}
