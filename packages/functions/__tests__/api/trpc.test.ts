import { TRPCError } from '@trpc/server';
import { describe, expect, it, vi } from 'vitest';
import { appRouter } from '../../api/router';
import { createContext } from '../../api/utils/trpc';

// Mock the context creation for testing
vi.mock('../../api/utils/trpc', async () => {
	const actual = await vi.importActual('../../api/utils/trpc');
	return {
		...actual,
		createContext: vi.fn().mockImplementation(({ event }) => {
			// Extract user ID from authorization header if present
			const authHeader = event?.headers?.authorization;
			if (authHeader && authHeader.startsWith('Bearer ')) {
				const userId = authHeader.split(' ')[1]; // Use token as user ID for testing
				return {
					headers: event.headers,
					user: { id: userId },
				};
			}
			return { headers: event?.headers || {} };
		}),
	};
});

describe('tRPC API', () => {
	describe('procedures', () => {
		it('should create a public procedure caller', async () => {
			const caller = appRouter.createCaller({
				headers: {},
			});

			// Public procedures should be accessible without authentication
			expect(caller.users).toBeDefined();
		});

		it('should create a protected procedure caller with authentication', async () => {
			const caller = appRouter.createCaller({
				headers: {},
				user: { id: 'test-user-id' },
			});

			// Protected procedures should be accessible with authentication
			expect(caller.users.getSelf).toBeDefined();
		});

		it('should throw error when accessing protected procedure without authentication', async () => {
			const caller = appRouter.createCaller({
				headers: {},
			});

			// Protected procedures should throw error without authentication
			await expect(caller.users.getSelf()).rejects.toThrow(TRPCError);
		});
	});

	describe('context Creation', () => {
		it('should create context without user when no authorization header', async () => {
			const context = await createContext({
				event: {
					headers: {},
				},
			} as any);

			expect(context.headers).toBeDefined();
			expect(context.user).toBeUndefined();
		});

		it('should create context with user when authorization header is present', async () => {
			// Mock decodeBearerToken to return a user
			vi.mock('@lumi/core/auth/auth.service', () => ({
				decodeBearerToken: vi.fn().mockResolvedValue({ id: 'test-user-id' }),
			}));

			const context = await createContext({
				event: {
					headers: {
						authorization: 'Bearer test-token',
					},
				},
			} as any);

			expect(context.headers).toBeDefined();
			expect(context.user).toBeDefined();
			expect(context.user?.id).toBe('test-user-id');
		});
	});
});
