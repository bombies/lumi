import type { User } from '@lumi/core/users/user.types';

import type { EntityType } from '../utils/dynamo/dynamo.types';

export enum WebSocketToken {
	RELATIONSHIP_USER = 'relationship_user',
	GLOBAL = 'global',
}

export enum WebSocketSubTopic {
	RELATIONSHIP = 'relationship',
	HEARTBEAT = 'heartbeat',
	MOMENT_CHAT = 'moment_chat',
}

export type WebSocketHeartbeat = {
	timestamp: number;
	payload: InferredWebSocketMessage<'heartbeat'>['payload'];
};

export type DatabaseWebSocketHeartbeat = WebSocketHeartbeat & {
	/**
	 * ws::heartbeat#<clientId>
	 */
	pk: string;
	/**
	 * ws::heartbeat#<clientId>
	 */
	sk: string;
	entityType: EntityType.WEBSOCKET_HEARTBEAT;
};

export type WebSocketMessage<E extends keyof WebSocketMessageMap, T = InferredWebSocketMessagePayload<E>> = {
	type: E;
	payload: T & {
		openUrl?: string;
	};
	timestamp: number;
	id?: string;
	source?: 'server' | 'client';
};

export type WebSocketMessageMap = {
	// Relationship prefix
	test: WebSocketMessage<'test', {
		sender: string;
		message: string;
	}>;

	connect: WebSocketMessage<'connect', {
		userId: string;
		username: string;
	}>;

	disconnect: WebSocketMessage<'disconnect', {
		userId: string;
		username: string;
	}>;

	presence: WebSocketMessage<'presence', {
		userId: string;
		username: string;
		status: User['status'];
	}>;

	heartbeat: WebSocketMessage<'heartbeat', {
		userId: string;
		username: string;
		relationshipId: string;
	}>;

	momentChat: WebSocketMessage<
		'momentChat',
		{
			senderId: string;
			message: string;
			messageId?: string;
			timestamp: string;
			momentId: string;
		}
	>;

	momentTypingStart: WebSocketMessage<'momentTypingStart', {
		senderId: string;
		timestamp: string;
	}>;

	momentTypingEnd: WebSocketMessage<'momentTypingEnd', {
		senderId: string;
		timestamp: string;
	}>;

	momentMessageReact: WebSocketMessage<'momentMessageReact', {
		senderId: string;
		timestamp: string;
		messageId: string;
		reaction: string;
	}>;

	momentMessageDelete: WebSocketMessage<'momentMessageDelete', {
		senderId: string;
		timestamp: string;
		messageId: string;
	}>;

	momentMessageStateUpdate: WebSocketMessage<'momentMessageStateUpdate', {
		senderId: string;
		timestamp: string;
		messageId: string;
		state?: 'delivered' | 'read';
		content?: string;
	}>;

	// Spe1cific user notifications
	notification: WebSocketMessage<
		'notification',
		{
			receiverId: string;
			from: { type: 'user' | 'system'; id?: string };
			message: {
				title: string;
				content: string;
			};
			metadata?: Record<string, any>;
		}
	>;
};

export const events = [
	'test',
	'connect',
	'disconnect',
	'presence',
	'heartbeat',
	'notification',
	'momentChat',
	'momentTypingStart',
	'momentTypingEnd',
	'momentMessageReact',
	'momentMessageDelete',
	'momentMessageStateUpdate',
] as (keyof WebSocketMessageMap)[];

export type Event = keyof WebSocketMessageMap;

export type InferredWebSocketMessage<T extends Event> = WebSocketMessageMap[T];
export type InferredWebSocketMessagePayload<T extends Event> = InferredWebSocketMessage<T>['payload'];

export type WebSocketEventHandler<T extends Event> =
	| ((payload: InferredWebSocketMessagePayload<T>) => void)
	| ((payload: InferredWebSocketMessagePayload<T>) => Promise<void>);

export const generateWSEventPayload = <T extends Event>(type: T, payload: InferredWebSocketMessage<T>['payload']) =>
	payload;
