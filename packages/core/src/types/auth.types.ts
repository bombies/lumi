import { EntityType } from './dynamo.types';

export type UserOTP = {
	code: string;
	expiresAt: number;
	userId: string;
};

export type DatabaseUserOTP = UserOTP & {
	/**
	 * pk: `otp#${user_id}`
	 */
	pk: string;
	/**
	 * sk: `otp#${user_id}`
	 */
	sk: string;
	entityType: EntityType.OTP;
};
