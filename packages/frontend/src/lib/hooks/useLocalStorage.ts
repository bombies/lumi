'use client';

import { useEffect, useState } from 'react';

export class ClientLocalStorage {
	constructor(private readonly storage: Storage) {}

	setItem(key: string, value: unknown) {
		this.storage.setItem(key, JSON.stringify(value));
	}

	getItem<T = unknown>(key: string) {
		try {
			const value = this.storage.getItem(key);
			return value ? (JSON.parse(value) as T) : null;
		} catch (e) {
			if (e instanceof SyntaxError) return null;
			throw e;
		}
	}

	removeItem(key: string) {
		this.storage.removeItem(key);
	}
}

export const useLocalStorage = () => {
	const [clientLocalStorage, setClientLocalStorage] = useState<ClientLocalStorage | null>(null);

	useEffect(() => {
		setClientLocalStorage(new ClientLocalStorage(window.localStorage));
	}, []);

	return clientLocalStorage;
};
