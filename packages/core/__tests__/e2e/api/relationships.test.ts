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

describe('relationships API', () => {
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
	let user3: any;
	let relationshipRequest: any;
	let relationship: any;

	beforeAll(async () => {
		// Create test users
		user1 = await createUser({
			email: 'rshipuser1@example.com',
			username: 'rshipuser1',
			firstName: 'Relationship',
			lastName: 'User1',
		});

		user2 = await createUser({
			email: 'rshipuser2@example.com',
			username: 'rshipuser2',
			firstName: 'Relationship',
			lastName: 'User2',
		});

		user3 = await createUser({
			email: 'rshipuser3@example.com',
			username: 'rshipuser3',
			firstName: 'Relationship',
			lastName: 'User3',
		});

		// Create a relationship request
		relationshipRequest = await sendRelationshipRequest(user1.id, user2.id);

		// Create a relationship between user3 and a new user
		const user4 = await createUser({
			email: 'rshipuser4@example.com',
			username: 'rshipuser4',
			firstName: 'Relationship',
			lastName: 'User4',
		});

		const request = await sendRelationshipRequest(user3.id, user4.id);
		relationship = await acceptRelationshipRequest(user4.id, request.id);
	});

	describe('sendRelationshipRequest', () => {
		it('should send a relationship request', async () => {
			// Create a new user to send request to
			const newUser = await createUser({
				email: 'newrshipuser@example.com',
				username: 'newrshipuser',
				firstName: 'New',
				lastName: 'User',
			});

			// Set authorization header with user1 ID
			const headers = {
				authorization: `Bearer ${user1.id}`,
			};

			const result = await trpcClient.relationships.sendRelationshipRequest(newUser.id, { headers });

			expect(result).toBeDefined();
			expect(result.sender).toBe(user1.id);
			expect(result.receiver).toBe(newUser.id);
		});

		it('should throw error when not authenticated', async () => {
			await expect(trpcClient.relationships.sendRelationshipRequest(user2.id)).rejects.toThrow();
		});
	});

	describe('getReceivedRelationshipRequests', () => {
		it('should return received relationship requests', async () => {
			// Set authorization header with user2 ID
			const headers = {
				authorization: `Bearer ${user2.id}`,
			};

			const result = await trpcClient.relationships.getReceivedRelationshipRequests({
				limit: 10,
			}, { headers });

			expect(result.data).toBeDefined();
			expect(result.data.length).toBeGreaterThan(0);
			expect(result.data[0].receiver).toBe(user2.id);
			expect(result.data[0].sender).toBe(user1.id);
		});
	});

	describe('getSentRelationshipRequests', () => {
		it('should return sent relationship requests', async () => {
			// Set authorization header with user1 ID
			const headers = {
				authorization: `Bearer ${user1.id}`,
			};

			const result = await trpcClient.relationships.getSentRelationshipRequests({
				limit: 10,
			}, { headers });

			expect(result.data).toBeDefined();
			expect(result.data.length).toBeGreaterThan(0);
			expect(result.data[0].sender).toBe(user1.id);
			expect(result.data[0].receiver).toBe(user2.id);
		});
	});

	describe('acceptRelationshipRequest', () => {
		it('should accept a relationship request', async () => {
			// Set authorization header with user2 ID
			const headers = {
				authorization: `Bearer ${user2.id}`,
			};

			const result = await trpcClient.relationships.acceptRelationshipRequest(relationshipRequest.id, { headers });

			expect(result).toBeDefined();
			expect(result.id).toBeDefined();
			expect([user1.id, user2.id]).toContain(result.partner1);
			expect([user1.id, user2.id]).toContain(result.partner2);
		});
	});

	describe('getRelationship', () => {
		it('should return the relationship for authenticated user', async () => {
			// Set authorization header with user3 ID
			const headers = {
				authorization: `Bearer ${user3.id}`,
			};

			const result = await trpcClient.relationships.getRelationship({}, { headers });

			expect(result).toBeDefined();
			expect(result.id).toBe(relationship.id);
			expect(result.partner1).toBe(relationship.partner1);
			expect(result.partner2).toBe(relationship.partner2);
		});

		it('should throw error when user is not in a relationship', async () => {
			// Create a new user without a relationship
			const noRelationshipUser = await createUser({
				email: 'norshipuser@example.com',
				username: 'norshipuser',
				firstName: 'NoRelationship',
				lastName: 'User',
			});

			// Set authorization header with new user ID
			const headers = {
				authorization: `Bearer ${noRelationshipUser.id}`,
			};

			await expect(trpcClient.relationships.getRelationship({}, { headers })).rejects.toThrow();
		});
	});

	describe('getRelationshipPartner', () => {
		it('should return the partner for authenticated user', async () => {
			// Set authorization header with user3 ID
			const headers = {
				authorization: `Bearer ${user3.id}`,
			};

			const result = await trpcClient.relationships.getRelationshipPartner({}, { headers });

			expect(result).toBeDefined();
			expect(result.id).not.toBe(user3.id);
			expect([relationship.partner1, relationship.partner2]).toContain(result.id);
		});
	});

	describe('leaveRelationship', () => {
		it('should allow user to leave a relationship', async () => {
			// Set authorization header with user1 ID (now in relationship with user2)
			const headers = {
				authorization: `Bearer ${user1.id}`,
			};

			const result = await trpcClient.relationships.leaveRelationship({}, { headers });

			expect(result).toBeDefined();
			expect(result.id).toBeDefined();
			expect([user1.id, user2.id]).toContain(result.partner1);
			expect([user1.id, user2.id]).toContain(result.partner2);

			// Verify user is no longer in relationship
			await expect(trpcClient.relationships.getRelationship({}, { headers })).rejects.toThrow();
		});
	});
});
