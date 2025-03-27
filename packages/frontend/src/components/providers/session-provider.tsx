'use client';

import { createContext, FC, PropsWithChildren, useContext } from 'react';

import { Session } from '@/lib/better-auth/auth-actions';

type SessionProviderData = {
	data: Session | undefined | null;
};

const SessionContext = createContext<SessionProviderData | undefined>(undefined);

export const useSession = () => {
	const session = useContext(SessionContext);
	if (!session) throw new Error('useSession must be used within a SessionProvider');

	return session;
};

const SessionProvider: FC<PropsWithChildren & { session: Session | undefined }> = ({ children, session }) => {
	return <SessionContext.Provider value={{ data: session }}>{children}</SessionContext.Provider>;
};

export default SessionProvider;
