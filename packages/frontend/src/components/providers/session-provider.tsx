'use client';

import { createContext, FC, PropsWithChildren, useContext } from 'react';
import { SupabaseUser } from '@lumi/core/types/auth.types';

type SessionProviderData = {
	data: SupabaseUser | undefined | null;
};

const SessionContext = createContext<SessionProviderData | undefined>(undefined);

export const useSession = () => {
	const session = useContext(SessionContext);
	if (!session) throw new Error('useSession must be used within a SessionProvider');

	return session;
};

const SessionProvider: FC<PropsWithChildren & { userResponse: SupabaseUser | undefined }> = ({
	children,
	userResponse,
}) => {
	return <SessionContext.Provider value={{ data: userResponse }}>{children}</SessionContext.Provider>;
};

export default SessionProvider;
