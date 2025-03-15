'use server';

import { getRelationshipForUser } from '@lumi/core/relationships/relationship.service';
import { updateUser } from '@lumi/core/users/users.service';

import { relationshipWSTopic } from '@/components/providers/web-sockets/topics';
import { sendServerWebsocketMessage } from '@/components/providers/web-sockets/web-socket-server-actions';
import { logger } from '../logger';

export const getRelationshipByUserId = async (userId: string) => {
	return getRelationshipForUser(userId);
};

export const sendSignOutNotification = async (userId: string, username: string) => {
	logger.debug(`Sending signout notification for ${userId}`);
	const relationship = await getRelationshipByUserId(userId);
	if (relationship) {
		await sendServerWebsocketMessage('presence', relationshipWSTopic(relationship.id), {
			status: 'offline',
			userId: userId,
			username: username,
		});
	}

	await updateUser(userId, { status: 'offline' });
};
