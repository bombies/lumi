import { defaultShouldDehydrateQuery, QueryClient } from '@tanstack/react-query';

export function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 30 * 1000,
				retryDelay: 500, // 500ms
			},
			dehydrate: {
				shouldDehydrateQuery: query => defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
			},
		},
	});
}
