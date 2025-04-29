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
