export type WebSocketMessage<E extends string, T extends object> = {
	type: E;
	payload: T;
	timestamp: number;
	id?: string;
	source?: 'server' | 'client';
};

export type WebSocketMessageMap = {
	test: WebSocketMessage<'test', { sender: string; message: string }>;
	connect: WebSocketMessage<'connect', { userId: string; username: string }>;
	disconnect: WebSocketMessage<'disconnect', { userId: string; username: string }>;
	presence: WebSocketMessage<'presence', { userId: string; username: string; status: 'online' | 'offline' | 'idle' }>;
};

export const events = ['test', 'connect', 'disconnect', 'presence'] as (keyof WebSocketMessageMap)[];

export type Event = (typeof events)[number];

export type InferredWebSocketMessage<T extends Event> = WebSocketMessageMap[T];

export type WebSocketEventHandler<T extends Event> =
	| ((payload: InferredWebSocketMessage<T>['payload']) => void)
	| ((payload: InferredWebSocketMessage<T>['payload']) => Promise<void>);

export const generateWSEventPayload = <T extends Event>(type: T, payload: InferredWebSocketMessage<T>['payload']) =>
	payload;
