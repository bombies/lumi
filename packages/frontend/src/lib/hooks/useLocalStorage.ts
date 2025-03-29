'use client';

import { useEffect, useState } from 'react';

export class ClientLocalStorage {
	constructor(private readonly storage: Storage) {}

	setItem(key: string, value: unknown) {
		this.setItemRaw(key, JSON.stringify(value));
	}

	setItemRaw(key: string, value: string) {
		this.storage.setItem(key, value);
	}

	getItem<T = unknown>(key: string) {
		try {
			const value = this.getItemRaw(key);
			return value ? (JSON.parse(value) as T) : null;
		} catch (e) {
			if (e instanceof SyntaxError) return null;
			throw e;
		}
	}

	getItemRaw(key: string) {
		return this.storage.getItem(key);
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
