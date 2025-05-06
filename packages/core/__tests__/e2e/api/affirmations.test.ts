import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { appRouter } from '../../../../packages/functions/api/router';
import { createContext } from '../../../../packages/functions/api/utils/trpc';
import { acceptRelationshipRequest, sendRelationshipRequest } from '../../../src/relationships/relationship.service';
import { createUser } from '../../../src/users/users.service';

// Mock the context creation for testing
vi.mock('../../../../packages/functions/api/utils/trpc', () => ({
	createContext: vi.fn().mockImplementation(({ event }) => {
		// Extract user ID from authorization header if present
		const authHeader = event.headers.authorization;
		if (authHeader && authHeader.startsWith('Bearer ')) {
			const userId = authHeader.split(' ')[1]; // Use token as user ID for testing
			return {
				headers: event.headers,
				user: { id: userId },
			};
		}
		return { headers: event.headers };
	}),
}));

describe('affirmations API', () => {
	const trpcClient = createTRPCProxyClient<typeof appRouter>({
		links: [
			httpBatchLink({
				url: 'http://localhost:3000/trpc',
				// Custom fetch implementation for testing
				fetch: async (url, options) => {
					const body = options?.body ? JSON.parse(options.body as string) : undefined;
					const headers = options?.headers || {};

					// Create mock event for context
					const mockEvent = {
						headers,
						body,
					};

					// Create context with mock event
					const ctx = await createContext({ event: mockEvent } as any);

					// Parse the URL to get the procedure path
					const path = url.toString().split('/trpc/')[1].split('?')[0];

					// Extract input from batch or single request
					let input;
					if (body?.batch) {
						input = body.batch[0].input;
					} else {
						input = body?.input;
					}

					// Call the procedure directly
					const caller = appRouter.createCaller(ctx);
					const result = await (path.includes('.')
						? path.split('.').reduce((acc, curr) => acc[curr], caller)(input)
						: caller[path](input));

					// Return mock response
					return {
						ok: true,
						json: async () => ({
							result: {
								data: result,
							},
						}),
					} as Response;
				},
			}),
		],
	});

	let user1: any;
	let user2: any;
	let relationship: any;
	let affirmation: any;

	beforeAll(async () => {
		// Create test users
		user1 = await createUser({
			email: 'affuser1@example.com',
			username: 'affuser1',
			firstName: 'Affirmation',
			lastName: 'User1',
		});

		user2 = await createUser({
			email: 'affuser2@example.com',
			username: 'affuser2',
			firstName: 'Affirmation',
			lastName: 'User2',
		});

		// Create a relationship between the users
		const request = await sendRelationshipRequest(user1.id, user2.id);
		relationship = await acceptRelationshipRequest(user2.id, request.id);
	});

	describe('createAffirmation', () => {
		it('should create an affirmation', async () => {
			// Set authorization header with user1 ID
			const headers = {
				authorization: `Bearer ${user1.id}`,
			};

			const affirmationData = {
				affirmation: 'You are amazing!',
			};

			affirmation = await trpcClient.affirmations.createAffirmation(affirmationData, { headers });

			expect(affirmation).toBeDefined();
			expect(affirmation.id).toBeDefined();
			expect(affirmation.affirmation).toBe(affirmationData.affirmation);
			expect(affirmation.ownerId).toBe(user1.id);
			expect(affirmation.relationshipId).toBe(relationship.id);
			expect(affirmation.selectedCount).toBe(0);
		});

		it('should throw error when not in a relationship', async () => {
			// Create a user not in a relationship
			const noRelationshipUser = await createUser({
				email: 'noreluser@example.com',
				username: 'noreluser',
				firstName: 'NoRel',
				lastName: 'User',
			});

			// Set authorization header with new user ID
			const headers = {
				authorization: `Bearer ${noRelationshipUser.id}`,
			};

			await expect(trpcClient.affirmations.createAffirmation({
				affirmation: 'Test affirmation',
			}, { headers })).rejects.toThrow();
		});
	});

	describe('getAffirmations', () => {
		it('should return affirmations for the authenticated user', async () => {
			// Set authorization header with user1 ID
			const headers = {
				authorization: `Bearer ${user1.id}`,
			};

			const result = await trpcClient.affirmations.getAffirmations({}, { headers });

			expect(result.data).toBeDefined();
			expect(result.data.length).toBeGreaterThan(0);
			expect(result.data[0].ownerId).toBe(user1.id);
			expect(result.data[0].affirmation).toBe('You are amazing!');
		});
	});

	describe('updateAffirmation', () => {
		it('should update an affirmation', async () => {
			// Set authorization header with user1 ID
			const headers = {
				authorization: `Bearer ${user1.id}`,
			};

			const updateData = {
				id: affirmation.id,
				affirmation: 'Updated affirmation text',
			};

			const result = await trpcClient.affirmations.updateAffirmation(updateData, { headers });

			expect(result).toBeDefined();
			expect(result.id).toBe(affirmation.id);
			expect(result.affirmation).toBe(updateData.affirmation);
		});
	});

	describe('sendCustomAffirmation', () => {
		it('should send a custom affirmation to partner', async () => {
			// Mock the notification service
			vi.mock('../../../src/notifications/notifications.service', () => ({
				sendNotification: vi.fn().mockResolvedValue(undefined),
			}));

			// Set authorization header with user1 ID
			const headers = {
				authorization: `Bearer ${user1.id}`,
			};

			const customAffirmation = {
				affirmation: 'Custom affirmation for you!',
			};

			// This should succeed without error
			await trpcClient.affirmations.sendCustomAffirmation(customAffirmation, { headers });

			// Check received affirmations
			const receivedAffirmations = await trpcClient.affirmations.getReceivedAffirmations({
				limit: 10,
			}, {
				headers: {
					authorization: `Bearer ${user2.id}`,
				},
			});

			expect(receivedAffirmations.data).toBeDefined();
			expect(receivedAffirmations.data.length).toBeGreaterThan(0);
			expect(receivedAffirmations.data[0].affirmation).toBe(customAffirmation.affirmation);
		});
	});

	describe('deleteAffirmation', () => {
		it('should delete an affirmation', async () => {
			// Create another affirmation to delete
			const headers = {
				authorization: `Bearer ${user1.id}`,
			};

			const newAffirmation = await trpcClient.affirmations.createAffirmation({
				affirmation: 'Affirmation to delete',
			}, { headers });

			// Delete the affirmation
			const result = await trpcClient.affirmations.deleteAffirmation(newAffirmation.id, { headers });

			expect(result).toBeDefined();
			expect(result.id).toBe(newAffirmation.id);

			// Verify affirmation is deleted by checking it's not in the list
			const affirmations = await trpcClient.affirmations.getAffirmations({}, { headers });
			expect(affirmations.data.find(a => a.id === newAffirmation.id)).toBeUndefined();
		});
	});
});
