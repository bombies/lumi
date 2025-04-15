import { MomentMessageDbKeys } from '../../moments/keys/moment-message.keys';
import { MomentTagDbKeys } from '../../moments/keys/moment-tag.keys';
import { MomentDbKeys } from '../../moments/keys/moment.keys';
import { RelationshipMomentTagDbKeys } from '../../moments/keys/relationship-moment-tag.keys';
import { AbstractDbKeys } from './abstract.keys';

class UserDbKeys extends AbstractDbKeys {
	constructor(prefix: string) {
		super(prefix);
	}

	pk(userId: string) {
		return this.buildKey(userId);
	}

	sk(userId: string) {
		return this.buildKey(userId);
	}

	gsi1pk() {
		return this.buildKey('username');
	}

	gsi1sk(username: string) {
		return this.buildKey(username);
	}

	gsi2pk() {
		return this.buildKey('email');
	}

	gsi2sk(email: string) {
		return this.buildKey(email);
	}
}

class RelationshipRequestDbKeys extends AbstractDbKeys {
	private static senderPrefix = 'rship::sender' as const;
	private static receiverPrefix = 'rship::receiver' as const;

	constructor(prefix: string) {
		super(prefix);
	}

	pk(id: string) {
		return this.buildKey(id);
	}

	sk(id: string) {
		return this.buildKey(id);
	}

	gsi1pk() {
		return RelationshipRequestDbKeys.senderPrefix;
	}

	gsi1sk(senderId: string) {
		return `${RelationshipRequestDbKeys.senderPrefix}#${senderId}`;
	}

	gsi2pk() {
		return RelationshipRequestDbKeys.receiverPrefix;
	}

	gsi2sk(receiverId: string) {
		return `${RelationshipRequestDbKeys.receiverPrefix}#${receiverId}`;
	}
}

class RelationshipDbKeys extends AbstractDbKeys {
	constructor(prefix: string) {
		super(prefix);
	}

	pk(relationshipId: string) {
		return this.buildKey(relationshipId);
	}

	sk(relationshipId: string) {
		return this.buildKey(relationshipId);
	}
}

class AffirmationDbKeys extends AbstractDbKeys {
	constructor(prefix: string) {
		super(prefix);
	}

	pk(relationshipId: string) {
		return this.buildKey(relationshipId);
	}

	sk(userId: string, affirmationId: string) {
		return this.buildKey(userId, affirmationId);
	}
}

class ReceivedAffirmationDbKeys extends AbstractDbKeys {
	constructor(prefix: string) {
		super(prefix);
	}

	pk(relationshipId: string) {
		return this.buildKey(relationshipId);
	}

	sk(receiverId: string, timestamp: string) {
		return this.buildKey(receiverId, timestamp);
	}
}

class NotificationSubscriberDbKeys extends AbstractDbKeys {
	constructor(prefix: string) {
		super(prefix);
	}

	pk(userId: string) {
		return this.buildKey(userId);
	}

	sk(endpoint: string) {
		return this.buildKey(endpoint);
	}
}

class NotificationDbKeys extends AbstractDbKeys {
	constructor(prefix: string) {
		super(prefix);
	}

	pk(notificationId: string) {
		return this.buildKey(notificationId);
	}

	sk(notificationId: string) {
		return this.buildKey(notificationId);
	}

	gsi1pk(userId: string) {
		return this.buildKey(userId);
	}

	gsi1sk(timestamp: string) {
		return this.buildKey(timestamp);
	}

	gsi2pk(userId: string) {
		return this.buildKey(userId);
	}

	gsi2sk(read: boolean, timestamp: string) {
		return this.buildKey(read ? 'read' : 'unread', timestamp);
	}
}

class UnreadNotificationDbKeys extends AbstractDbKeys {
	constructor(prefix: string) {
		super(prefix);
	}

	pk(userId: string) {
		return this.buildKey(userId);
	}

	sk(userId: string) {
		return this.buildKey(userId);
	}
}

class SongRecommendationDbKeys extends AbstractDbKeys {
	constructor(prefix: string) {
		super(prefix);
	}

	pk(recommendationId: string) {
		return this.buildKey(recommendationId);
	}

	sk(recommendationId: string) {
		return this.buildKey(recommendationId);
	}

	gsi1pk(relationshipId: string) {
		return this.buildKey(relationshipId);
	}

	gsi1sk(recommenderId: string, listened: boolean, createdAt: string) {
		return this.buildKey(recommenderId, listened ? 'listened' : 'unlistened', createdAt);
	}

	gsi2pk(recommenderId: string) {
		return this.buildKey(recommenderId);
	}

	gsi2sk(trackId: string) {
		return this.buildKey(trackId);
	}

	gsi3pk(relationshipId: string) {
		return this.buildKey(relationshipId);
	}

	gsi3sk(relationshipId: string, updateTimestamp: string) {
		return this.buildKey(relationshipId, updateTimestamp);
	}
}

class WebSocketHeartbeatDbKeys extends AbstractDbKeys {
	constructor(prefix: string) {
		super(prefix);
	}

	pk() {
		return this.buildKey();
	}

	sk(clientId: string) {
		return this.buildKey(clientId);
	}
}

export class DynamoKey {
	private constructor() {}

	static user = new UserDbKeys('user#');

	static relationshipRequest = new RelationshipRequestDbKeys('rshipreq#');
	static relationship = new RelationshipDbKeys('rship#');

	static affirmation = new AffirmationDbKeys('rship::affirmation#');
	static receivedAffirmation = new ReceivedAffirmationDbKeys('rship::received_affirmation#');

	static notifications = new NotificationDbKeys('notification#');
	static unreadNotificationCount = new UnreadNotificationDbKeys('unread::notification::count#');
	static notificationSubscriber = new NotificationSubscriberDbKeys('notification::subscriber#');

	static moment = new MomentDbKeys();
	static momentMessage = new MomentMessageDbKeys();
	static momentTag = new MomentTagDbKeys();
	static relationshipMomentTag = new RelationshipMomentTagDbKeys();

	static songRecommendation = new SongRecommendationDbKeys('songrec#');

	static webSocketHeartbeat = new WebSocketHeartbeatDbKeys('ws::heartbeat#');
}

export enum EntityType {
	USER = 'USER',
	RELATIONSHIP_REQUEST = 'RELATIONSHIP_REQUEST',
	RELATIONSHIP = 'RELATIONSHIP',

	AFFIRMATION = 'AFFIRMATION',
	RECEIVED_AFFIRMATION = 'RECEIVED_AFFIRMATION',

	MOMENT_DETAILS = 'MOMENT_DETAILS',
	MOMENT_MESSAGE = 'MOMENT_MESSAGE',
	RELATIONSHIP_MOMENT_TAG = 'RELATIONSHIP_MOMENT_TAG',
	MOMENT_TAG = 'MOMENT_TAG',

	NOTIFICATION_SUBSCRIBER = 'NOTIFICATION_SUBSCRIBER',
	NOTIFICATION = 'NOTIFICATION',
	UNREAD_NOTIFICATION_COUNT = 'UNREAD_NOTIFICATION_COUNT',

	WEBSOCKET_HEARTBEAT = 'WEBSOCKET_HEARTBEAT',

	SONG_RECOMMENDATION = 'SONG_RECOMMENDATION',
}
