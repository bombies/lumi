'use client';

import { createContext, FC, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { Relationship } from '@lumi/core/types/relationship.types';
import { User } from '@lumi/core/types/user.types';
import { WebSocketEventHandler } from '@lumi/core/types/websockets.types';

import { useWebSocket } from '@/components/providers/web-sockets/web-socket-provider';
import { logger } from '@/lib/logger';

type RelationshipProviderData = {
	relationship: Relationship;
	partner: User;
};

type RelationshipProviderProps = PropsWithChildren<{
	relationship: Relationship;
	partner: User;
}>;

const RelationshipContext = createContext<RelationshipProviderData | undefined>(undefined);

export const useRelationship = () => {
	const context = useContext(RelationshipContext);
	if (!context) throw new Error('useRelationship must be used within a RelationshipProvider');
	return context;
};

const RelationshipProvider: FC<RelationshipProviderProps> = ({ children, relationship, partner }) => {
	const { addEventHandler, removeEventHandler } = useWebSocket();
	const [userState, setUserState] = useState<User>(partner);

	useEffect(() => {
		const presenceHandler: WebSocketEventHandler<'presence'> = payload => {
			logger.debug('presence event received', payload);
			if (payload.userId !== partner.id) return;
			logger.debug('handling partner presence event', payload);
			setUserState(state => ({ ...state, status: payload.status }));
		};

		addEventHandler('presence', presenceHandler);

		return () => {
			removeEventHandler('presence', presenceHandler);
		};
	}, [addEventHandler, partner.id, removeEventHandler]);

	const memoizedValue = useMemo(() => ({ relationship, partner: userState }), [relationship, userState]);
	return <RelationshipContext.Provider value={memoizedValue}>{children}</RelationshipContext.Provider>;
};

export default RelationshipProvider;
