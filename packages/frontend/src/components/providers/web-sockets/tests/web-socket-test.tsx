'use client';

import type { WebSocketEventHandler } from '@lumi/core/websockets/websockets.types';
import type { FC } from 'react';
import { useEffect, useState } from 'react';

import { useWebSocket } from '@/components/providers/web-sockets/web-socket-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { auth } from '@/lib/better-auth/auth-client';
import { logger } from '@/lib/logger';

const WebSocketTest: FC = () => {
	const { data: session } = auth.useSession();
	const { connectionStatus, addEventHandler, removeEventHandler, emitEvent } = useWebSocket();
	const [messages, setMessages] = useState<string[]>([]);
	const [inputValue, setInputValue] = useState('');

	useEffect(() => {
		const testHandler: WebSocketEventHandler<'test'> = (payload) => {
			logger.debug('Received message:', payload);
			setMessages(messages => [...messages, `${payload.sender}: ${payload.message}`]);
		};

		const presenceHandler: WebSocketEventHandler<'presence'> = (payload) => {
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
			<p className="capitalize">
				Status:
				{connectionStatus}
			</p>
			<p>Messages:</p>
			{messages.map((message, index) => (
				<p key={index}>{message}</p>
			))}
			<div className="flex gap-2">
				<Input className="w-96" value={inputValue} onValueChange={val => setInputValue(val as string)} />
				<Button
					className="flex gap-2"
					onClick={async () => {
						await emitEvent('test', { sender: session!.user.id, message: inputValue });
					}}
				>
					send message
				</Button>
			</div>
		</div>
	);
};

export default WebSocketTest;
