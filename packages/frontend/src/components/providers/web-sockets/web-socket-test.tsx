'use client';

import { FC, useEffect, useState } from 'react';

import { WebSocketEventHandler } from '@/components/providers/web-sockets/web-socket-messages';
import { useWebSocket } from '@/components/providers/web-sockets/web-socket-provider';
import { Button } from '@/components/ui/button';

const WebSocketTest: FC = () => {
	const { isConnected, addEventHandler, removeEventHandler, emitEvent } = useWebSocket();
	const [messages, setMessages] = useState<string[]>([]);

	useEffect(() => {
		const handler: WebSocketEventHandler<'test'> = payload => {
			setMessages(messages => [...messages, `${payload.sender}: ${payload.message}`]);
		};
		addEventHandler('test', handler);

		return () => {
			removeEventHandler('test', handler);
		};
	}, [addEventHandler, removeEventHandler]);

	return (
		<div>
			<p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
			<p>Messages:</p>
			{messages.map((message, index) => (
				<p key={index}>{message}</p>
			))}
			<Button
				className="flex gap-2"
				onClick={() => {
					emitEvent(process.env.NEXT_PUBLIC_NOTIFICATIONS_TOPIC!, 'test', { sender: 'me', message: 'hello' });
				}}
			>
				send message
			</Button>
		</div>
	);
};

export default WebSocketTest;
