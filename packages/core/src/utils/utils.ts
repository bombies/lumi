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

export const urlBase64ToUint8Array = (base64String: string) => {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

	// @ts-ignore
	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
};

export const substituteVariables = (str: string, variables: Record<string, string>) => {
	return str.replace(/{(\w+)}/g, (match, key) => variables[key] || match);
};
