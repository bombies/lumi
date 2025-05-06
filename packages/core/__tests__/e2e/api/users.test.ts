import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { appRouter } from '../../../../packages/functions/api/router';
import { createContext } from '../../../../packages/functions/api/utils/trpc';
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

describe('users API', () => {
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

	let testUser: any;

	beforeAll(async () => {
		// Create a test user
		testUser = await createUser({
			email: 'apitest@example.com',
			username: 'apitestuser',
			firstName: 'API',
			lastName: 'Test',
		});
	});

	describe('getUsersByUsername', () => {
		it('should return users matching username pattern', async () => {
			const result = await trpcClient.users.getUsersByUsername({
				username: 'apitest',
				limit: 10,
			});

			expect(result.data).toBeDefined();
			expect(result.data.length).toBeGreaterThan(0);
			expect(result.data[0].username).toContain('apitest');
		});
	});

	describe('getUsersByEmail', () => {
		it('should return users matching email pattern', async () => {
			const result = await trpcClient.users.getUsersByEmail({
				email: 'apitest',
				limit: 10,
			});

			expect(result.data).toBeDefined();
			expect(result.data.length).toBeGreaterThan(0);
			expect(result.data[0].email).toContain('apitest');
		});
	});

	describe('getSelf', () => {
		it('should return the authenticated user', async () => {
			// Set authorization header with test user ID
			const headers = {
				authorization: `Bearer ${testUser.id}`,
			};

			const result = await trpcClient.users.getSelf({}, { headers });

			expect(result).toBeDefined();
			expect(result?.id).toBe(testUser.id);
			expect(result?.username).toBe(testUser.username);
		});

		it('should throw error when not authenticated', async () => {
			await expect(trpcClient.users.getSelf()).rejects.toThrow();
		});
	});

	describe('updateSelf', () => {
		it('should update user properties', async () => {
			// Set authorization header with test user ID
			const headers = {
				authorization: `Bearer ${testUser.id}`,
			};

			const updateData = {
				firstName: 'Updated',
				lastName: 'Name',
			};

			const result = await trpcClient.users.updateSelf(updateData, { headers });

			expect(result).toBeDefined();
			expect(result.firstName).toBe(updateData.firstName);
			expect(result.lastName).toBe(updateData.lastName);
		});

		it('should throw error when not authenticated', async () => {
			await expect(trpcClient.users.updateSelf({
				firstName: 'Unauthorized',
			})).rejects.toThrow();
		});
	});

	describe('getUserByIdSafe', () => {
		it('should return safe user data by ID', async () => {
			// Set authorization header with test user ID
			const headers = {
				authorization: `Bearer ${testUser.id}`,
			};

			const result = await trpcClient.users.getUserByIdSafe(testUser.id, { headers });

			expect(result).toBeDefined();
			expect(result?.id).toBe(testUser.id);
			expect(result?.username).toBe(testUser.username);
			expect(result?.firstName).toBe('Updated'); // From previous test
			expect(result?.lastName).toBe('Name'); // From previous test

			// Should not include sensitive fields
			expect(result?.email).toBeUndefined();
		});
	});
});
