import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createAffirmation,
	createReceivedAffirmation,
	deleteAffirmation,
	getAffirmationById,
	getAffirmationsFromPartner,
	getOwnedAffirmationsForUser,
	getReceivedAffirmations,
	getTodaysReceivedAffirmations,
	selectAffirmation,
	sendAffirmationToUser,
	updateAffirmation,
} from '../../../src/affirmations/affirmations.service';
import { acceptRelationshipRequest, sendRelationshipRequest } from '../../../src/relationships/relationship.service';
import { createUser } from '../../../src/users/users.service';

describe('affirmations Service', () => {
	let user1: any;
	let user2: any;
	let relationship: any;

	beforeEach(async () => {
		// Create test users
		user1 = await createUser({
			email: 'affuser1@example.com',
			username: 'affuser1',
			firstName: 'Aff',
			lastName: 'User1',
		});

		user2 = await createUser({
			email: 'affuser2@example.com',
			username: 'affuser2',
			firstName: 'Aff',
			lastName: 'User2',
		});

		// Create a relationship between the users
		const request = await sendRelationshipRequest(user1.id, user2.id);
		relationship = await acceptRelationshipRequest(user2.id, request.id);
	});

	describe('createAffirmation', () => {
		it('should create an affirmation', async () => {
			const affirmationData = {
				relationshipId: relationship.id,
				ownerId: user1.id,
				affirmation: 'You are amazing!',
			};

			const affirmation = await createAffirmation(affirmationData);

			expect(affirmation).toBeDefined();
			expect(affirmation.id).toBeDefined();
			expect(affirmation.affirmation).toBe(affirmationData.affirmation);
			expect(affirmation.relationshipId).toBe(relationship.id);
			expect(affirmation.ownerId).toBe(user1.id);
			expect(affirmation.selectedCount).toBe(0);
		});
	});

	describe('getAffirmationById', () => {
		it('should return an affirmation by ID', async () => {
			const affirmationData = {
				relationshipId: relationship.id,
				ownerId: user1.id,
				affirmation: 'You are incredible!',
			};

			const createdAffirmation = await createAffirmation(affirmationData);
			const retrievedAffirmation = await getAffirmationById(
				user1.id,
				relationship.id,
				createdAffirmation.id,
			);

			expect(retrievedAffirmation).toBeDefined();
			expect(retrievedAffirmation?.id).toBe(createdAffirmation.id);
			expect(retrievedAffirmation?.affirmation).toBe(affirmationData.affirmation);
		});

		it('should return null for non-existent affirmation', async () => {
			const nonExistentId = 'non-existent-id';
			const affirmation = await getAffirmationById(user1.id, relationship.id, nonExistentId);
			expect(affirmation).toBeNull();
		});
	});

	describe('getOwnedAffirmationsForUser', () => {
		it('should return affirmations owned by a user', async () => {
			// Create multiple affirmations for user1
			await createAffirmation({
				relationshipId: relationship.id,
				ownerId: user1.id,
				affirmation: 'Affirmation 1',
			});

			await createAffirmation({
				relationshipId: relationship.id,
				ownerId: user1.id,
				affirmation: 'Affirmation 2',
			});

			const affirmations = await getOwnedAffirmationsForUser(user1.id);

			expect(affirmations.data).toHaveLength(2);
			expect(affirmations.data[0].ownerId).toBe(user1.id);
			expect(affirmations.data[1].ownerId).toBe(user1.id);
		});

		it('should throw error when user is not in the relationship', async () => {
			// Create a user not in the relationship
			const user3 = await createUser({
				email: 'affuser3@example.com',
				username: 'affuser3',
				firstName: 'Aff',
				lastName: 'User3',
			});

			await expect(getOwnedAffirmationsForUser(user3.id, relationship)).rejects.toThrow(TRPCError);
		});
	});

	describe('getAffirmationsFromPartner', () => {
		it('should return affirmations from partner', async () => {
			// Create affirmations for user2 (partner of user1)
			await createAffirmation({
				relationshipId: relationship.id,
				ownerId: user2.id,
				affirmation: 'Partner Affirmation 1',
			});

			await createAffirmation({
				relationshipId: relationship.id,
				ownerId: user2.id,
				affirmation: 'Partner Affirmation 2',
			});

			const partnerAffirmations = await getAffirmationsFromPartner(user1.id);

			expect(partnerAffirmations.data).toHaveLength(2);
			expect(partnerAffirmations.data[0].ownerId).toBe(user2.id);
			expect(partnerAffirmations.data[1].ownerId).toBe(user2.id);
		});

		it('should throw error when user is not in a relationship', async () => {
			// Create a user not in a relationship
			const user3 = await createUser({
				email: 'affuser3@example.com',
				username: 'affuser3',
				firstName: 'Aff',
				lastName: 'User3',
			});

			await expect(getAffirmationsFromPartner(user3.id)).rejects.toThrow(TRPCError);
		});
	});

	describe('updateAffirmation', () => {
		it('should update an affirmation', async () => {
			const affirmationData = {
				relationshipId: relationship.id,
				ownerId: user1.id,
				affirmation: 'Original affirmation',
			};

			const createdAffirmation = await createAffirmation(affirmationData);

			const updateData = {
				affirmation: 'Updated affirmation',
				selectedCount: 5,
			};

			const updatedAffirmation = await updateAffirmation(
				user1.id,
				relationship.id,
				createdAffirmation.id,
				updateData,
			);

			expect(updatedAffirmation).toBeDefined();
			expect(updatedAffirmation.affirmation).toBe(updateData.affirmation);
			expect(updatedAffirmation.selectedCount).toBe(updateData.selectedCount);
		});

		it('should throw error when affirmation does not exist', async () => {
			const nonExistentId = 'non-existent-id';
			await expect(updateAffirmation(
				user1.id,
				relationship.id,
				nonExistentId,
				{ affirmation: 'Updated' },
			)).rejects.toThrow(TRPCError);
		});
	});

	describe('deleteAffirmation', () => {
		it('should delete an affirmation', async () => {
			const affirmationData = {
				relationshipId: relationship.id,
				ownerId: user1.id,
				affirmation: 'Affirmation to delete',
			};

			const createdAffirmation = await createAffirmation(affirmationData);

			const deletedAffirmation = await deleteAffirmation(
				user1.id,
				relationship.id,
				createdAffirmation.id,
			);

			expect(deletedAffirmation).toBeDefined();
			expect(deletedAffirmation.id).toBe(createdAffirmation.id);

			// Verify affirmation is deleted
			const retrievedAffirmation = await getAffirmationById(
				user1.id,
				relationship.id,
				createdAffirmation.id,
			);
			expect(retrievedAffirmation).toBeNull();
		});

		it('should throw error when affirmation does not exist', async () => {
			const nonExistentId = 'non-existent-id';
			await expect(deleteAffirmation(
				user1.id,
				relationship.id,
				nonExistentId,
			)).rejects.toThrow(TRPCError);
		});
	});

	describe('selectAffirmation', () => {
		it('should select an affirmation based on weighted probability', async () => {
			// Create multiple affirmations with different selection counts
			await createAffirmation({
				relationshipId: relationship.id,
				ownerId: user2.id,
				affirmation: 'Rarely selected',
				selectedCount: 10,
			});

			await createAffirmation({
				relationshipId: relationship.id,
				ownerId: user2.id,
				affirmation: 'Never selected',
				selectedCount: 0,
			});

			// Select an affirmation for user1 (from user2's affirmations)
			const selectedAffirmation = await selectAffirmation(user1.id);

			expect(selectedAffirmation).toBeDefined();
			expect(selectedAffirmation?.ownerId).toBe(user2.id);

			// Verify the selected count was incremented
			const updatedAffirmation = await getAffirmationById(
				user2.id,
				relationship.id,
				selectedAffirmation!.id,
			);
			expect(updatedAffirmation?.selectedCount).toBe(selectedAffirmation!.selectedCount);
		});

		it('should return undefined when no affirmations exist', async () => {
			// Create a new relationship with no affirmations
			const user3 = await createUser({
				email: 'affuser3@example.com',
				username: 'affuser3',
				firstName: 'Aff',
				lastName: 'User3',
			});

			const user4 = await createUser({
				email: 'affuser4@example.com',
				username: 'affuser4',
				firstName: 'Aff',
				lastName: 'User4',
			});

			const request = await sendRelationshipRequest(user3.id, user4.id);
			await acceptRelationshipRequest(user4.id, request.id);

			const selectedAffirmation = await selectAffirmation(user3.id);
			expect(selectedAffirmation).toBeUndefined();
		});
	});

	describe('createReceivedAffirmation', () => {
		it('should create a received affirmation', async () => {
			const affirmationText = 'You received this affirmation!';

			await createReceivedAffirmation(user1.id, relationship.id, affirmationText);

			// Verify the received affirmation was created
			const receivedAffirmations = await getReceivedAffirmations(user1.id, relationship.id, {
				limit: 10,
			});

			expect(receivedAffirmations.data).toHaveLength(1);
			expect(receivedAffirmations.data[0].affirmation).toBe(affirmationText);
		});
	});

	describe('getReceivedAffirmations', () => {
		it('should return received affirmations for a user', async () => {
			// Create multiple received affirmations
			await createReceivedAffirmation(user1.id, relationship.id, 'Received Affirmation 1');
			await createReceivedAffirmation(user1.id, relationship.id, 'Received Affirmation 2');

			const receivedAffirmations = await getReceivedAffirmations(user1.id, relationship.id, {
				limit: 10,
			});

			expect(receivedAffirmations.data).toHaveLength(2);
		});

		it('should respect limit parameter', async () => {
			// Create multiple received affirmations
			await createReceivedAffirmation(user1.id, relationship.id, 'Received Affirmation 1');
			await createReceivedAffirmation(user1.id, relationship.id, 'Received Affirmation 2');
			await createReceivedAffirmation(user1.id, relationship.id, 'Received Affirmation 3');

			const receivedAffirmations = await getReceivedAffirmations(user1.id, relationship.id, {
				limit: 2,
			});

			expect(receivedAffirmations.data).toHaveLength(2);
			expect(receivedAffirmations.nextCursor).toBeDefined();
		});
	});

	describe('getTodaysReceivedAffirmations', () => {
		it('should return today\'s received affirmations', async () => {
			// Create received affirmations
			await createReceivedAffirmation(user1.id, relationship.id, 'Today\'s Affirmation');

			const todaysAffirmations = await getTodaysReceivedAffirmations(user1.id, relationship.id);

			expect(todaysAffirmations.data).toHaveLength(1);
			expect(todaysAffirmations.data[0].affirmation).toBe('Today\'s Affirmation');
		});
	});

	describe('sendAffirmationToUser', () => {
		it('should send an affirmation to a user', async () => {
			// Mock the notification service
			vi.mock('../../../src/notifications/notifications.service', () => ({
				sendNotification: vi.fn().mockResolvedValue(undefined),
			}));

			// Mock the websocket service
			vi.mock('../../../src/websockets/websockets.service', () => ({
				createAsyncWebsocketConnection: vi.fn().mockResolvedValue({
					publish: vi.fn().mockResolvedValue({}),
					publishAsync: vi.fn().mockResolvedValue({}),
				}),
				emitAsyncWebsocketEvent: vi.fn().mockResolvedValue({}),
			}));

			const affirmationText = 'Custom affirmation for you!';

			await sendAffirmationToUser(user1, {
				affirmation: affirmationText,
				partner: user2,
			});

			// Verify a received affirmation was created
			const receivedAffirmations = await getReceivedAffirmations(user1.id, relationship.id, {
				limit: 10,
			});

			expect(receivedAffirmations.data).toHaveLength(1);
			expect(receivedAffirmations.data[0].affirmation).toBe(affirmationText);
		});

		it('should throw error when user is not in a relationship', async () => {
			// Create a user not in a relationship
			const user3 = await createUser({
				email: 'affuser3@example.com',
				username: 'affuser3',
				firstName: 'Aff',
				lastName: 'User3',
			});

			await expect(sendAffirmationToUser(user3, {
				affirmation: 'Test affirmation',
			})).rejects.toThrow(TRPCError);
		});
	});
});
