import type { ApiClient } from '@/lib/api/api';

export abstract class ApiService {
	constructor(protected readonly api: ApiClient, private readonly prefix: string) {}

	protected endpoint(path: string | undefined, params?: Record<string, any>) {
		const endpoint = `/${this.prefix}${path ?? ''}`;
		return !params ? endpoint : this.urlWithParams(`${endpoint}`, params);
	}

	protected urlWithParams(url: string, params?: Record<string, any>) {
		if (!params || Object.keys(params).length === 0) {
			return url;
		}

		const searchParams = new URLSearchParams();

		Object.entries(params).forEach(([key, value]) => {
			if (value === null || value === undefined) {
				return;
			}

			let processedValue: string;
			if (Array.isArray(value)) {
				value.forEach((val) => {
					searchParams.append(key, String(val));
				});
				return;
			} else if (typeof value === 'object') {
				processedValue = JSON.stringify(value);
			} else {
				processedValue = String(value);
			}

			searchParams.append(key, processedValue);
		});

		const paramString = searchParams.toString();

		if (!paramString) {
			return url;
		}

		return `${url}${url.includes('?') ? '&' : '?'}${paramString}`;
	}
}
