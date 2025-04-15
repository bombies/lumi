import { useQuery } from '@tanstack/react-query';

import { auth } from './auth-client';

export const GetUserAccounts = () => {
	return useQuery({
		queryKey: ['user-accounts'],
		queryFn: async () => {
			return auth.listAccounts();
		},
	});
};
