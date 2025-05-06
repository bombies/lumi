import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	acceptRelationshipRequest,
	deleteRelationshipRequestById,
	deleteUserRelationship,
	getPartnerForUser,
	getReceivedRelationshipRequestsForUser,
	getRelationshipById,
	getRelationshipForUser,
	getRelationshipRequestById,
	getSentRelationshipRequestsForUser,
	sendRelationshipRequest,
	userInRelationship,
} from '../../../src/relationships/relationship.service';
import { createUser } from '../../../src/users/users.service';

describe('relationship Service', () => {
	let user1: any;
	let user2: any;
	let user3: any;

	beforeEach(async () => {
		// Create test users
		user1 = await createUser({
			email: 'user1@example.com',
			username: 'user1',
			firstName: 'User',
			lastName: 'One',
		});

		user2 = await createUser({
			email: 'user2@example.com',
			username: 'user2',
			firstName: 'User',
			lastName: 'Two',
		});

		user3 = await createUser({
			email: 'user3@example.com',
			username: 'user3',
			firstName: 'User',
			lastName: 'Three',
		});
	});

	describe('sendRelationshipRequest', () => {
		it('should create a relationship request', async () => {
			const request = await sendRelationshipRequest(user1.id, user2.id);

			expect(request).toBeDefined();
			expect(request.sender).toBe(user1.id);
			expect(request.receiver).toBe(user2.id);
			expect(request.createdAt).toBeDefined();
		});

		it('should throw error when sending request to self', async () => {
			await expect(sendRelationshipRequest(user1.id, user1.id)).rejects.toThrow(TRPCError);
		});

		it('should throw error when sender is already in a relationship', async () => {
			// First create a relationship between user1 and user2
			const request = await sendRelationshipRequest(user1.id, user2.id);
			await acceptRelationshipRequest(user2.id, request.id);

			// Now try to send a request from user1 to user3
			await expect(sendRelationshipRequest(user1.id, user3.id)).rejects.toThrow(TRPCError);
		});

		it('should throw error when receiver is already in a relationship', async () => {
			// First create a relationship between user2 and user3
			const request = await sendRelationshipRequest(user2.id, user3.id);
			await acceptRelationshipRequest(user3.id, request.id);

			// Now try to send a request from user1 to user2
			await expect(sendRelationshipRequest(user1.id, user2.id)).rejects.toThrow(TRPCError);
		});

		it('should throw error when request already exists', async () => {
			// Send first request
			await sendRelationshipRequest(user1.id, user2.id);

			// Try to send the same request again
			await expect(sendRelationshipRequest(user1.id, user2.id)).rejects.toThrow(TRPCError);
		});
	});

	describe('getRelationshipRequestById', () => {
		it('should return a relationship request by ID', async () => {
			const request = await sendRelationshipRequest(user1.id, user2.id);
			const retrievedRequest = await getRelationshipRequestById(request.id);

			expect(retrievedRequest).toBeDefined();
			expect(retrievedRequest?.id).toBe(request.id);
			expect(retrievedRequest?.sender).toBe(user1.id);
			expect(retrievedRequest?.receiver).toBe(user2.id);
		});

		it('should return null for non-existent request ID', async () => {
			const nonExistentId = 'non-existent-id';
			const request = await getRelationshipRequestById(nonExistentId);
			expect(request).toBeNull();
		});
	});

	describe('getReceivedRelationshipRequestsForUser', () => {
		it('should return requests received by a user', async () => {
			// User1 sends request to user2
			await sendRelationshipRequest(user1.id, user2.id);

			// User3 sends request to user2
			await sendRelationshipRequest(user3.id, user2.id);

			const receivedRequests = await getReceivedRelationshipRequestsForUser({
				userId: user2.id,
				limit: 10,
			});

			expect(receivedRequests.data).toHaveLength(2);
			expect(receivedRequests.data[0].receiver).toBe(user2.id);
			expect([user1.id, user3.id]).toContain(receivedRequests.data[0].sender);
			expect(receivedRequests.data[1].receiver).toBe(user2.id);
			expect([user1.id, user3.id]).toContain(receivedRequests.data[1].sender);
		});
	});

	describe('getSentRelationshipRequestsForUser', () => {
		it('should return requests sent by a user', async () => {
			// User1 sends request to user2
			await sendRelationshipRequest(user1.id, user2.id);

			// User1 sends request to user3
			await sendRelationshipRequest(user1.id, user3.id);

			const sentRequests = await getSentRelationshipRequestsForUser({
				userId: user1.id,
				limit: 10,
			});

			expect(sentRequests.data).toHaveLength(2);
			expect(sentRequests.data[0].sender).toBe(user1.id);
			expect([user2.id, user3.id]).toContain(sentRequests.data[0].receiver);
			expect(sentRequests.data[1].sender).toBe(user1.id);
			expect([user2.id, user3.id]).toContain(sentRequests.data[1].receiver);
		});
	});

	describe('acceptRelationshipRequest', () => {
		it('should create a relationship when accepting a request', async () => {
			// User1 sends request to user2
			const request = await sendRelationshipRequest(user1.id, user2.id);

			// User2 accepts the request
			const relationship = await acceptRelationshipRequest(user2.id, request.id);

			expect(relationship).toBeDefined();
			expect(relationship.id).toBeDefined();
			expect([user1.id, user2.id]).toContain(relationship.partner1);
			expect([user1.id, user2.id]).toContain(relationship.partner2);
			expect(relationship.partner1).not.toBe(relationship.partner2);

			// Verify users are now in a relationship
			const inRelationship1 = await userInRelationship(user1.id);
			const inRelationship2 = await userInRelationship(user2.id);
			expect(inRelationship1).toBe(true);
			expect(inRelationship2).toBe(true);

			// Verify request is deleted
			const deletedRequest = await getRelationshipRequestById(request.id);
			expect(deletedRequest).toBeNull();
		});

		it('should throw error when non-receiver tries to accept', async () => {
			// User1 sends request to user2
			const request = await sendRelationshipRequest(user1.id, user2.id);

			// User3 tries to accept the request
			await expect(acceptRelationshipRequest(user3.id, request.id)).rejects.toThrow(TRPCError);
		});

		it('should throw error for non-existent request', async () => {
			const nonExistentId = 'non-existent-id';
			await expect(acceptRelationshipRequest(user2.id, nonExistentId)).rejects.toThrow(TRPCError);
		});
	});

	describe('deleteRelationshipRequestById', () => {
		it('should allow sender to delete their request', async () => {
			// User1 sends request to user2
			const request = await sendRelationshipRequest(user1.id, user2.id);

			// User1 deletes the request
			await deleteRelationshipRequestById(user1.id, request.id);

			// Verify request is deleted
			const deletedRequest = await getRelationshipRequestById(request.id);
			expect(deletedRequest).toBeNull();
		});

		it('should allow receiver to delete a request', async () => {
			// User1 sends request to user2
			const request = await sendRelationshipRequest(user1.id, user2.id);

			// User2 deletes the request
			await deleteRelationshipRequestById(user2.id, request.id);

			// Verify request is deleted
			const deletedRequest = await getRelationshipRequestById(request.id);
			expect(deletedRequest).toBeNull();
		});

		it('should throw error when non-participant tries to delete', async () => {
			// User1 sends request to user2
			const request = await sendRelationshipRequest(user1.id, user2.id);

			// User3 tries to delete the request
			await expect(deleteRelationshipRequestById(user3.id, request.id)).rejects.toThrow(TRPCError);
		});
	});

	describe('getRelationshipById', () => {
		it('should return a relationship by ID', async () => {
			// Create a relationship
			const request = await sendRelationshipRequest(user1.id, user2.id);
			const createdRelationship = await acceptRelationshipRequest(user2.id, request.id);

			// Get the relationship by ID
			const relationship = await getRelationshipById(createdRelationship.id);

			expect(relationship).toBeDefined();
			expect(relationship?.id).toBe(createdRelationship.id);
			expect([user1.id, user2.id]).toContain(relationship?.partner1);
			expect([user1.id, user2.id]).toContain(relationship?.partner2);
		});
	});

	describe('userInRelationship', () => {
		it('should return true when user is in a relationship', async () => {
			// Create a relationship
			const request = await sendRelationshipRequest(user1.id, user2.id);
			await acceptRelationshipRequest(user2.id, request.id);

			// Check if users are in a relationship
			const inRelationship1 = await userInRelationship(user1.id);
			const inRelationship2 = await userInRelationship(user2.id);

			expect(inRelationship1).toBe(true);
			expect(inRelationship2).toBe(true);
		});

		it('should return false when user is not in a relationship', async () => {
			const inRelationship = await userInRelationship(user3.id);
			expect(inRelationship).toBe(false);
		});
	});

	describe('getRelationshipForUser', () => {
		it('should return the relationship for a user', async () => {
			// Create a relationship
			const request = await sendRelationshipRequest(user1.id, user2.id);
			const createdRelationship = await acceptRelationshipRequest(user2.id, request.id);

			// Get relationship for user1
			const relationship1 = await getRelationshipForUser(user1.id);

			expect(relationship1).toBeDefined();
			expect(relationship1?.id).toBe(createdRelationship.id);

			// Get relationship for user2
			const relationship2 = await getRelationshipForUser(user2.id);

			expect(relationship2).toBeDefined();
			expect(relationship2?.id).toBe(createdRelationship.id);
		});

		it('should return undefined when user is not in a relationship', async () => {
			const relationship = await getRelationshipForUser(user3.id);
			expect(relationship).toBeUndefined();
		});
	});

	describe('getPartnerForUser', () => {
		it('should return the partner for a user in a relationship', async () => {
			// Create a relationship
			const request = await sendRelationshipRequest(user1.id, user2.id);
			await acceptRelationshipRequest(user2.id, request.id);

			// Get partner for user1
			const partner1 = await getPartnerForUser(user1.id);

			expect(partner1).toBeDefined();
			expect(partner1?.id).toBe(user2.id);

			// Get partner for user2
			const partner2 = await getPartnerForUser(user2.id);

			expect(partner2).toBeDefined();
			expect(partner2?.id).toBe(user1.id);
		});

		it('should return undefined when user is not in a relationship', async () => {
			const partner = await getPartnerForUser(user3.id);
			expect(partner).toBeUndefined();
		});
	});

	describe('deleteUserRelationship', () => {
		it('should delete a relationship', async () => {
			// Create a relationship
			const request = await sendRelationshipRequest(user1.id, user2.id);
			const createdRelationship = await acceptRelationshipRequest(user2.id, request.id);

			// Delete the relationship
			const deletedRelationship = await deleteUserRelationship(user1.id);

			expect(deletedRelationship).toBeDefined();
			expect(deletedRelationship?.id).toBe(createdRelationship.id);

			// Verify users are no longer in a relationship
			const inRelationship1 = await userInRelationship(user1.id);
			const inRelationship2 = await userInRelationship(user2.id);
			expect(inRelationship1).toBe(false);
			expect(inRelationship2).toBe(false);
		});

		it('should throw error when user is not in a relationship', async () => {
			await expect(deleteUserRelationship(user3.id)).rejects.toThrow(TRPCError);
		});
	});
});
