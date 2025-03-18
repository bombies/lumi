'use client';

import { createContext, FC, PropsWithChildren, useCallback, useContext, useState } from 'react';
import { SupabaseUser, SupabaseUserMetaData } from '@lumi/core/types/auth.types';
import { UserResponse } from '@supabase/supabase-js';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type SessionProviderData = {
	data: { user: SupabaseUser | null };
	error: UserResponse['error'];
	update: (data: Partial<SupabaseUserMetaData>) => Promise<void>;
};

const SessionContext = createContext<SessionProviderData | undefined>(undefined);

export const useSession = () => {
	const session = useContext(SessionContext);
	if (!session) throw new Error('useSession must be used within a SessionProvider');

	return session;
};

const SessionProvider: FC<PropsWithChildren & { userResponse: UserResponse }> = ({ children, userResponse }) => {
	const [response, setResponse] = useState<UserResponse>(userResponse);
	const supabase = createSupabaseBrowserClient();
	const update = useCallback(
		async (data: Partial<SupabaseUserMetaData>) => {
			if (!userResponse.data.user) return;
			const response = await supabase.auth.admin.updateUserById(userResponse.data.user.id, {
				user_metadata: {
					...userResponse.data.user.user_metadata,
					...data,
				},
			});
			setResponse(response);
		},
		[supabase.auth.admin, userResponse.data.user],
	);
	return (
		<SessionContext.Provider
			value={{ data: response.data as { user: SupabaseUser | null }, error: response.error, update }}
		>
			{children}
		</SessionContext.Provider>
	);
};

export default SessionProvider;
