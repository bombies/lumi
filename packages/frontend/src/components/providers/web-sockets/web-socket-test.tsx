'use client';

import { FC, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import { WebSocketEventHandler } from '@/components/providers/web-sockets/web-socket-messages';
import { useWebSocket } from '@/components/providers/web-sockets/web-socket-provider';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

const WebSocketTest: FC = () => {
	const { data: session } = useSession();
	const { connectionStatus, addEventHandler, removeEventHandler, emitEvent } = useWebSocket();
	const [messages, setMessages] = useState<string[]>([]);

	useEffect(() => {
		const testHandler: WebSocketEventHandler<'test'> = payload => {
			logger.debug('Received message:', payload);
			setMessages(messages => [...messages, `${payload.sender}: ${payload.message}`]);
		};

		const presenceHandler: WebSocketEventHandler<'presence'> = payload => {
			logger.debug('Received message:', payload);
			setMessages(messages => [...messages, `${payload.username} is now ${payload.status}`]);
		};

		addEventHandler('test', testHandler);
		addEventHandler('presence', presenceHandler);

		return () => {
			removeEventHandler('test', testHandler);
			removeEventHandler('presence', presenceHandler);
		};
	}, [addEventHandler, removeEventHandler]);

	return (
		<div>
			<p className="capitalize">Status: {connectionStatus}</p>
			<p>Messages:</p>
			{messages.map((message, index) => (
				<p key={index}>{message}</p>
			))}
			<Button
				className="flex gap-2"
				onClick={() => {
					emitEvent('test', { sender: session!.user.username!, message: 'hello' });
				}}
			>
				send message
			</Button>
		</div>
	);
};

export default WebSocketTest;
