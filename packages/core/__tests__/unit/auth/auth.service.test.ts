import { Buffer } from 'node:buffer';
import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	decodeBearerToken,
	encodeJwtToken,
	registerUser,
	verify,
} from '../../../src/auth/auth.service';
import { createUser } from '../../../src/users/users.service';

describe('auth Service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('registerUser', () => {
		it('should register a new user', async () => {
			const userData = {
				email: 'register@example.com',
				username: 'registeruser',
				firstName: 'Register',
				lastName: 'User',
				password: 'Password123!',
			};

			const user = await registerUser(userData);

			expect(user).toBeDefined();
			expect(user.id).toBeDefined();
			expect(user.email).toBe(userData.email);
			expect(user.username).toBe(userData.username);
			expect(user.firstName).toBe(userData.firstName);
			expect(user.lastName).toBe(userData.lastName);
			expect(user.createdAt).toBeDefined();
			expect(user.updatedAt).toBeDefined();
		});

		it('should throw error when email already exists', async () => {
			const userData = {
				email: 'duplicate-email@example.com',
				username: 'uniqueusername',
				firstName: 'Duplicate',
				lastName: 'Email',
				password: 'Password123!',
			};

			// Create user first
			await createUser({
				email: userData.email,
				username: 'existinguser',
				firstName: 'Existing',
				lastName: 'User',
			});

			// Try to register with same email
			await expect(registerUser(userData)).rejects.toThrow(TRPCError);
		});

		it('should throw error when username already exists', async () => {
			const userData = {
				email: 'unique-email@example.com',
				username: 'duplicateusername',
				firstName: 'Duplicate',
				lastName: 'Username',
				password: 'Password123!',
			};

			// Create user first
			await createUser({
				email: 'existing@example.com',
				username: userData.username,
				firstName: 'Existing',
				lastName: 'User',
			});

			// Try to register with same username
			await expect(registerUser(userData)).rejects.toThrow(TRPCError);
		});
	});

	describe('encodeJwtToken', () => {
		it('should encode a JWT token', async () => {
			const payload = {
				id: 'test-user-id',
				email: 'test@example.com',
			};

			const token = await encodeJwtToken(payload, {
				expirationTime: '1h',
				iat: Math.floor(Date.now() / 1000),
			});

			expect(token).toBeDefined();
			expect(typeof token).toBe('string');
		});
	});

	describe('verify', () => {
		it('should verify a valid token', async () => {
			// Mock TextEncoder
			// @ts-expect-error Not defining all the fields
			globalThis.TextEncoder = class {
				encode(text: string) {
					return new Uint8Array(Buffer.from(text));
				}
			};

			// Mock jwtVerify
			vi.mock('jose', () => ({
				jwtVerify: vi.fn().mockResolvedValue({
					payload: { id: 'test-user-id', email: 'test@example.com' },
				}),
			}));

			const payload = await verify('valid-token', 'test-secret');

			expect(payload).toBeDefined();
			expect(payload.id).toBe('test-user-id');
			expect(payload.email).toBe('test@example.com');
		});

		it('should accept expired token when acceptExpired is true', async () => {
			// Mock TextEncoder
			// @ts-expect-error Not defining all the fields
			globalThis.TextEncoder = class {
				encode(text: string) {
					return new Uint8Array(Buffer.from(text));
				}
			};

			// Mock jwtVerify to throw JWTExpired
			vi.mock('jose', () => ({
				jwtVerify: vi.fn().mockRejectedValue({
					name: 'JWTExpired',
					payload: { id: 'expired-user-id', email: 'expired@example.com' },
				}),
				JWTExpired: Error,
			}));

			const payload = await verify('expired-token', 'test-secret', { acceptExpired: true });

			expect(payload).toBeDefined();
			expect(payload.id).toBe('expired-user-id');
			expect(payload.email).toBe('expired@example.com');
		});
	});

	describe('decodeBearerToken', () => {
		it('should decode a valid bearer token', async () => {
			// Mock createRemoteJWKSet and jwtVerify
			vi.mock('jose', () => ({
				createRemoteJWKSet: vi.fn().mockReturnValue(() => Promise.resolve({ keys: [] })),
				jwtVerify: vi.fn().mockResolvedValue({
					payload: { id: 'bearer-user-id', email: 'bearer@example.com' },
				}),
			}));

			const payload = await decodeBearerToken('Bearer valid-token');

			expect(payload).toBeDefined();
			expect(payload?.id).toBe('bearer-user-id');
			expect(payload?.email).toBe('bearer@example.com');
		});

		it('should return null for invalid token format', async () => {
			const payload = await decodeBearerToken('InvalidToken');
			expect(payload).toBeNull();
		});

		it('should throw error for expired token', async () => {
			// Mock createRemoteJWKSet and jwtVerify to throw JWTExpired
			vi.mock('jose', () => ({
				createRemoteJWKSet: vi.fn().mockReturnValue(() => Promise.resolve({ keys: [] })),
				jwtVerify: vi.fn().mockRejectedValue({
					name: 'JWTExpired',
				}),
				JWTExpired: Error,
			}));

			await expect(decodeBearerToken('Bearer expired-token')).rejects.toThrow(TRPCError);
		});

		it('should throw error for invalid signature', async () => {
			// Mock createRemoteJWKSet and jwtVerify to throw JWSInvalid
			vi.mock('jose', () => ({
				createRemoteJWKSet: vi.fn().mockReturnValue(() => Promise.resolve({ keys: [] })),
				jwtVerify: vi.fn().mockRejectedValue({
					name: 'JWSInvalid',
				}),
				JWSInvalid: Error,
			}));

			await expect(decodeBearerToken('Bearer invalid-signature')).rejects.toThrow(TRPCError);
		});
	});
});
