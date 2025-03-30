abstract class AbstractDbKeys {
	constructor(protected readonly prefix: string) {}

	buildKey(...suffix: string[]) {
		return `${this.prefix}${suffix.join('#')}`;
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

export class KeyPrefix {
	static USER = 'user#' as const;
	static USER_NAME = 'user#username' as const;
	static USER_EMAIL = 'user#email' as const;
	static RELATIONSHIP_REQUEST = 'rshipreq#' as const;
	static RELATIONSHIP = 'rship#' as const;
	static RELATIONSHIP_REQUEST_SENDER = 'rship::sender' as const;
	static RELATIONSHIP_REQUEST_RECEIVER = 'rship::receiver' as const;
	static AFFIRMATION = 'rship::affirmation#' as const;
	static RECEIVED_AFFIRMATION = 'rship::received_affirmation#' as const;
	static MOMENT_DETAILS = 'moment::details#' as const;
	static MOMENT_MESSAGE = 'moment::message#' as const;
	static SONG_RECOMMENDATION = 'songrec#' as const;
	static NOTIFICATION_SUBSCRIBER = 'notification::subscriber#' as const;
	static WEBSOCKET_HEARTBEAT = 'ws::heartbeat#' as const;
	static NOTIFICATION = 'notification#' as const;
	static UNREAD_NOTIFICATION_COUNT = 'unread::notification::count#' as const;

	private constructor() {}

	static affirmation = new AffirmationDbKeys(this.AFFIRMATION);
	static receivedAffirmation = new ReceivedAffirmationDbKeys(this.RECEIVED_AFFIRMATION);
	static notifications = new NotificationDbKeys(this.NOTIFICATION);
	static unreadNotificationCount = new UnreadNotificationDbKeys(this.UNREAD_NOTIFICATION_COUNT);
}

export enum EntityType {
	USER = 'USER',
	RELATIONSHIP_REQUEST = 'RELATIONSHIP_REQUEST',
	RELATIONSHIP = 'RELATIONSHIP',
	AFFIRMATION = 'AFFIRMATION',
	RECEIVED_AFFIRMATION = 'RECEIVED_AFFIRMATION',
	MOMENT_DETAILS = 'MOMENT_DETAILS',
	MOMENT_MESSAGE = 'MOMENT_MESSAGE',
	NOTIFICATION_SUBSCRIBER = 'NOTIFICATION_SUBSCRIBER',
	WEBSOCKET_HEARTBEAT = 'WEBSOCKET_HEARTBEAT',
	NOTIFICATION = 'NOTIFICATION',
	UNREAD_NOTIFICATION_COUNT = 'UNREAD_NOTIFICATION_COUNT',
}
