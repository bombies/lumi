import { WebSocketSubTopic } from '@lumi/core/types/websockets.types';

export const relationshipWSTopic = (relationshipId: string) =>
	`${process.env.NEXT_PUBLIC_NOTIFICATIONS_TOPIC!}/${WebSocketSubTopic.RELATIONSHIP}/${relationshipId}`;

export const userNotificationsTopic = (userId: string) => `${process.env.NEXT_PUBLIC_NOTIFICATIONS_TOPIC!}/${userId}`;
