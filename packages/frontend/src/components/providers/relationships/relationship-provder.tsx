'use client';

import type { Relationship } from '@lumi/core/relationships/relationship.types';
import type { User } from '@lumi/core/users/user.types';
import type { InferredWebSocketMessagePayload, WebSocketEventHandler } from '@lumi/core/websockets/websockets.types';
import type { FC, PropsWithChildren } from 'react';
import type { InferredSelfStatePayload, SelfState, SelfStateData } from './self-state';

import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';
import { useWebSocket } from '@/components/providers/web-sockets/web-socket-provider';
import { logger } from '@/lib/logger';
import { WebsocketTopic } from '../web-sockets/topics';

type RelationshipProviderData = {
	relationship: Relationship;
	self: User;
	selfState?: {
		state?: SelfStateData<SelfState>;
		updateState?: <T extends SelfState>(state: T | null, payload?: InferredSelfStatePayload<T>) => void;
	};
	partner: User;
	sendNotificationToPartner: (
		message: InferredWebSocketMessagePayload<'notification'>['message'] & {
			openUrl?: string;
			metadata?: Record<string, any>;
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
	const context = use(RelationshipContext);
	if (!context) throw new Error('useRelationship must be used within a RelationshipProvider');
	return context;
};

const RelationshipProvider: FC<RelationshipProviderProps> = ({ children, relationship, self, partner }) => {
	const { addEventHandler, removeEventHandler, emitEvent } = useWebSocket();
	const [partnerState, setPartnerState] = useState<User>(partner);
	const [selfState, setSelfState] = useState<SelfStateData<SelfState>>();

	useEffect(() => {
		const presenceHandler: WebSocketEventHandler<'presence'> = (payload) => {
			logger.debug('presence event received', payload);
			if (payload.userId !== partner.id) return;
			logger.debug('handling partner presence event', payload);
			setPartnerState(state => ({ ...state, status: payload.status }));
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
			metadata,
		}: InferredWebSocketMessagePayload<'notification'>['message'] & {
			openUrl?: string;
			metadata?: Record<string, any>;
		}) => {
			return emitEvent(
				'notification',
				{
					receiverId: partner.id,
					from: { type: 'user' },
					message: { title, content },
					openUrl,
					metadata,
				},
				{
					topic: WebsocketTopic.userNotificationsTopic(partner.id),
				},
			);
		},
		[emitEvent, partner.id],
	);

	const updateState = useCallback<
		<T extends SelfState>(state: T | null, payload?: InferredSelfStatePayload<T>) => void
	>((state, payload) => {
				if (!state) setSelfState(undefined);
				else if (payload) setSelfState({ state, payload });
			}, []);

	const memoizedValue = useMemo(
		() => ({
			relationship,
			partner: partnerState,
			self,
			sendNotificationToPartner,
			selfState: {
				state: selfState,
				updateState,
			},
		}),
		[relationship, partnerState, self, sendNotificationToPartner, selfState, updateState],
	);
	return <RelationshipContext value={memoizedValue}>{children}</RelationshipContext>;
};

export default RelationshipProvider;
