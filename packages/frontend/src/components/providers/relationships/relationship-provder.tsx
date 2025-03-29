'use client';

import { createContext, FC, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Relationship } from '@lumi/core/types/relationship.types';
import { User } from '@lumi/core/types/user.types';
import { InferredWebSocketMessagePayload, WebSocketEventHandler } from '@lumi/core/types/websockets.types';

import { useWebSocket } from '@/components/providers/web-sockets/web-socket-provider';
import { logger } from '@/lib/logger';
import { WebsocketTopic } from '../web-sockets/topics';

type RelationshipProviderData = {
	relationship: Relationship;
	self: User;
	partner: User;
	sendNotificationToPartner: (
		message: InferredWebSocketMessagePayload<'notification'>['message'] & {
			openUrl?: string;
		},
	) => Promise<void>;
};

type RelationshipProviderProps = PropsWithChildren<{
	relationship: Relationship;
	self: User;
	partner: User;
}>;

const RelationshipContext = createContext<RelationshipProviderData | undefined>(undefined);

export const useRelationship = () => {
	const context = useContext(RelationshipContext);
	if (!context) throw new Error('useRelationship must be used within a RelationshipProvider');
	return context;
};

const RelationshipProvider: FC<RelationshipProviderProps> = ({ children, relationship, self, partner }) => {
	const { addEventHandler, removeEventHandler, emitEvent } = useWebSocket();
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

	const sendNotificationToPartner = useCallback(
		({
			title,
			content,
			openUrl,
		}: InferredWebSocketMessagePayload<'notification'>['message'] & {
			openUrl?: string;
		}) => {
			return emitEvent(
				'notification',
				{
					receiverId: partner.id,
					from: { type: 'user' },
					message: { title, content },
					openUrl,
				},
				{
					topic: WebsocketTopic.userNotificationsTopic(partner.id),
				},
			);
		},
		[emitEvent, partner.id],
	);

	const memoizedValue = useMemo(
		() => ({ relationship, partner: userState, self, sendNotificationToPartner }),
		[relationship, self, sendNotificationToPartner, userState],
	);
	return <RelationshipContext.Provider value={memoizedValue}>{children}</RelationshipContext.Provider>;
};

export default RelationshipProvider;
