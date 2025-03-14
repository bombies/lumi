import { Relationship } from '../types/relationship.types';

export const extractPartnerIdFromRelationship = (userId: string, relationship: Relationship) =>
	userId === relationship.partner1 ? relationship.partner2 : relationship.partner1;
