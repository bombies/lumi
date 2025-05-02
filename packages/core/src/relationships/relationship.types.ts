import type { User } from '../users/user.types';
import type { EntityType } from '../utils/dynamo/dynamo.types';

export type RelationshipRequest = {
	id: string;
	sender: string;
	receiver: string;
	createdAt: string;
} & RelationshipRequestExtras;

export type RelationshipRequestExtras = Partial<{
	otherUser: Pick<User, 'id' | 'username' | 'firstName' | 'lastName'>;
}>;

export type DatabaseRelationshipRequest = RelationshipRequest & {
	/**
	 * rshipreq#<id>
	 */
	pk: string;
	/**
	 * rshipreq#<id>
	 */
	sk: string;
	/**
	 * rshipreq::sender
	 */
	gsi1pk: string;
	/**
	 * rshipreq::sender#<server_id>
	 */
	gsi1sk: string;
	/**
	 * rshipreq::receiver
	 */
	gsi2pk: string;
	/**
	 * rshipreq::receiver#<receiver_id>
	 */
	gsi2sk: string;
	entityType: EntityType.RELATIONSHIP_REQUEST;
};

export type Relationship = {
	id: string;
	partner1: string;
	partner2: string;
	createdAt: string;
} & RelationshipExtras;

export type RelationshipExtras = Partial<{
	partner: User;
	self: User;
}>;

export type DatabaseRelationship = Relationship & {
	/**
	 * rship#<id>
	 */
	pk: string;
	/**
	 * rship#<id>
	 */
	sk: string;
	entityType: EntityType.RELATIONSHIP;
};
