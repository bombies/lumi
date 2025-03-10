export enum KeyPrefix {
	USER = 'user#',
	USER_NAME = 'user#username',
	USER_EMAIL = 'user#email',

	OTP = 'otp#',

	RELATIONSHIP_REQUEST = 'rshipreq#',
	RELATIONSHIP = 'rship#',
	RELATIONSHIP_REQUEST_SENDER = 'rship::sender',
	RELATIONSHIP_REQUEST_RECEIVER = 'rship::receiver',
}

export enum EntityType {
	USER = 'USER',
	OTP = 'OTP',
	RELATIONSHIP_REQUEST = 'RELATIONSHIP_REQUEST',
	RELATIONSHIP = 'RELATIONSHIP',
}
