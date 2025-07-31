export type DynamoPrimaryKey = {
	pk: string;
	sk: string;
};

export type DynamoGSI1Keys = {
	gsi1pk: string;
	gsi1sk: string;
};

export type DynamoGSI2Keys = {
	gsi2pk: string;
	gsi2sk: string;
};

export type DynamoGSI3Keys = {
	gsi3pk: string;
	gsi3sk: string;
};

export type DynamoGSI4Keys = {
	gsi4pk: string;
	gsi4sk: string;
};

export enum DynamoEntityType {
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

	IMPORTANT_DATE = 'IMPORTANT_DATE',
}

export type DynamoRecord<T extends DynamoEntityType = DynamoEntityType> = DynamoPrimaryKey & {
	entityType: T;
};
