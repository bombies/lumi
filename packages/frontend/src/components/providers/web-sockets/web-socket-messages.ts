export type WebSocketMessage<E extends string, T extends object> = {
	type: E;
	payload: T;
};

export const events = ['test'] as const;
export type Event = (typeof events)[number];
export type InferredWebSocketMessage<T extends Event> = T extends 'test' ? TestWebSocketMessage : never;
export type WebSocketEventHandler<T extends Event> =
	| ((payload: InferredWebSocketMessage<T>['payload']) => void)
	| ((payload: InferredWebSocketMessage<T>['payload']) => Promise<void>);

export type TestWebSocketMessage = WebSocketMessage<'test', { sender: string; message: string }>;
