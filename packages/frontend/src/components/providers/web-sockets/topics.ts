import { WebSocketSubTopic } from '@lumi/core/websockets/websockets.types';

export class WebsocketTopic {
	private static prefix = process.env.NEXT_PUBLIC_NOTIFICATIONS_TOPIC!;

	private constructor() {}

	static relationshipWSTopic(relationshipId: string) {
		return `${this.prefix}/${WebSocketSubTopic.RELATIONSHIP}/${relationshipId}`;
	}

	static heartbeatTopic(relationshipId: string) {
		return `${this.prefix}/${WebSocketSubTopic.RELATIONSHIP}/${relationshipId}/${WebSocketSubTopic.HEARTBEAT}`;
	}

	static userNotificationsTopic(userId: string) {
		return `${this.prefix}/${userId}/notifications`;
	}

	static momentChatTopic(relationshipId: string, momentId: string) {
		return `${this.prefix}/${WebSocketSubTopic.RELATIONSHIP}/${relationshipId}/${WebSocketSubTopic.MOMENT_CHAT}/${momentId}`;
	}
}
