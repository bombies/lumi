import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createUser,
	deleteUser,
	getUserByEmail,
	getUserById,
	getUserByUsername,
	getUsersByEmail,
	getUsersByUsername,
	updateUser,
} from '../../../src/users/users.service';

describe('users Service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('createUser', () => {
		it('should create a user successfully', async () => {
			const userData = {
				email: 'test@example.com',
				username: 'testuser',
				firstName: 'Test',
				lastName: 'User',
			};

			const createdUser = await createUser(userData);

			expect(createdUser).toBeDefined();
			expect(createdUser.id).toBeDefined();
			expect(createdUser.email).toBe(userData.email);
			expect(createdUser.username).toBe(userData.username);
			expect(createdUser.firstName).toBe(userData.firstName);
			expect(createdUser.lastName).toBe(userData.lastName);
			expect(createdUser.createdAt).toBeDefined();
			expect(createdUser.updatedAt).toBeDefined();
		});

		it('should throw an error if email already exists', async () => {
			const userData = {
				email: 'duplicate@example.com',
				username: 'uniqueuser',
				firstName: 'Test',
				lastName: 'User',
			};

			// Create the first user
			await createUser(userData);

			// Try to create another user with the same email
			await expect(createUser({
				...userData,
				username: 'differentuser',
			})).rejects.toThrow(TRPCError);
		});

		it('should throw an error if username already exists', async () => {
			const userData = {
				email: 'unique@example.com',
				username: 'duplicateuser',
				firstName: 'Test',
				lastName: 'User',
			};

			// Create the first user
			await createUser(userData);

			// Try to create another user with the same username
			await expect(createUser({
				...userData,
				email: 'different@example.com',
			})).rejects.toThrow(TRPCError);
		});
	});

	describe('getUserById', () => {
		it('should return a user by ID', async () => {
			const userData = {
				email: 'getbyid@example.com',
				username: 'getbyiduser',
				firstName: 'Get',
				lastName: 'ById',
			};

			const createdUser = await createUser(userData);
			const retrievedUser = await getUserById(createdUser.id);

			expect(retrievedUser).toBeDefined();
			expect(retrievedUser?.id).toBe(createdUser.id);
			expect(retrievedUser?.email).toBe(userData.email);
		});

		it('should return undefined for non-existent user ID', async () => {
			const nonExistentId = 'non-existent-id';
			const user = await getUserById(nonExistentId);
			expect(user).toBeUndefined();
		});

		it('should return only requested projections', async () => {
			const userData = {
				email: 'projections@example.com',
				username: 'projectionsuser',
				firstName: 'Projection',
				lastName: 'User',
			};

			const createdUser = await createUser(userData);
			const retrievedUser = await getUserById(createdUser.id, {
				projections: ['id', 'username'],
			});

			expect(retrievedUser).toBeDefined();
			expect(retrievedUser?.id).toBe(createdUser.id);
			expect(retrievedUser?.username).toBe(userData.username);
			// Email should not be included in the projections
			expect(retrievedUser?.email).toBeUndefined();
		});
	});

	describe('getUserByEmail', () => {
		it('should return a user by email', async () => {
			const userData = {
				email: 'getbyemail@example.com',
				username: 'getbyemailuser',
				firstName: 'Get',
				lastName: 'ByEmail',
			};

			const createdUser = await createUser(userData);
			const retrievedUser = await getUserByEmail(userData.email);

			expect(retrievedUser).toBeDefined();
			expect(retrievedUser?.id).toBe(createdUser.id);
			expect(retrievedUser?.email).toBe(userData.email);
		});

		it('should return undefined for non-existent email', async () => {
			const nonExistentEmail = 'nonexistent@example.com';
			const user = await getUserByEmail(nonExistentEmail);
			expect(user).toBeUndefined();
		});
	});

	describe('getUserByUsername', () => {
		it('should return a user by username', async () => {
			const userData = {
				email: 'getbyusername@example.com',
				username: 'getbyusernameuser',
				firstName: 'Get',
				lastName: 'ByUsername',
			};

			const createdUser = await createUser(userData);
			const retrievedUser = await getUserByUsername(userData.username);

			expect(retrievedUser).toBeDefined();
			expect(retrievedUser?.id).toBe(createdUser.id);
			expect(retrievedUser?.username).toBe(userData.username);
		});

		it('should return undefined for non-existent username', async () => {
			const nonExistentUsername = 'nonexistentuser';
			const user = await getUserByUsername(nonExistentUsername);
			expect(user).toBeUndefined();
		});
	});

	describe('updateUser', () => {
		it('should update user properties', async () => {
			const userData = {
				email: 'update@example.com',
				username: 'updateuser',
				firstName: 'Update',
				lastName: 'User',
			};

			const createdUser = await createUser(userData);

			const updateData = {
				firstName: 'Updated',
				lastName: 'UserName',
			};

			const updatedUser = await updateUser(createdUser.id, updateData);

			expect(updatedUser).toBeDefined();
			expect(updatedUser.firstName).toBe(updateData.firstName);
			expect(updatedUser.lastName).toBe(updateData.lastName);
			expect(updatedUser.email).toBe(userData.email); // Email should remain unchanged
			expect(updatedUser.username).toBe(userData.username); // Username should remain unchanged
			expect(updatedUser.updatedAt).not.toBe(createdUser.updatedAt); // updatedAt should change
		});

		it('should throw an error when updating non-existent user', async () => {
			const nonExistentId = 'non-existent-id';
			await expect(updateUser(nonExistentId, { firstName: 'New' })).rejects.toThrow(TRPCError);
		});
	});

	describe('deleteUser', () => {
		it('should delete a user', async () => {
			const userData = {
				email: 'delete@example.com',
				username: 'deleteuser',
				firstName: 'Delete',
				lastName: 'User',
			};

			const createdUser = await createUser(userData);

			// Mock the relationship service to avoid actual deletion of relationships
			vi.mock('../../../src/relationships/relationship.service', () => ({
				deleteUserRelationship: vi.fn().mockResolvedValue(undefined),
			}));

			await deleteUser(createdUser.id);

			// Verify user no longer exists
			const deletedUser = await getUserById(createdUser.id);
			expect(deletedUser).toBeUndefined();
		});
	});

	describe('getUsersByUsername', () => {
		it('should return users matching username pattern', async () => {
			// Create test users
			await createUser({
				email: 'search1@example.com',
				username: 'searchuser1',
				firstName: 'Search',
				lastName: 'User1',
			});

			await createUser({
				email: 'search2@example.com',
				username: 'searchuser2',
				firstName: 'Search',
				lastName: 'User2',
			});

			await createUser({
				email: 'other@example.com',
				username: 'otheruser',
				firstName: 'Other',
				lastName: 'User',
			});

			const result = await getUsersByUsername({
				username: 'searchuser',
				limit: 10,
			});

			expect(result.data).toHaveLength(2);
			expect(result.data[0].username).toMatch(/searchuser/);
			expect(result.data[1].username).toMatch(/searchuser/);
		});

		it('should respect limit parameter', async () => {
			// Create multiple test users
			for (let i = 1; i <= 5; i++) {
				await createUser({
					email: `limit${i}@example.com`,
					username: `limituser${i}`,
					firstName: 'Limit',
					lastName: `User${i}`,
				});
			}

			const result = await getUsersByUsername({
				username: 'limituser',
				limit: 3,
			});

			expect(result.data).toHaveLength(3);
			expect(result.nextCursor).toBeDefined();
		});
	});

	describe('getUsersByEmail', () => {
		it('should return users matching email pattern', async () => {
			// Create test users
			await createUser({
				email: 'emailsearch1@example.com',
				username: 'emailuser1',
				firstName: 'Email',
				lastName: 'User1',
			});

			await createUser({
				email: 'emailsearch2@example.com',
				username: 'emailuser2',
				firstName: 'Email',
				lastName: 'User2',
			});

			await createUser({
				email: 'different@example.com',
				username: 'diffuser',
				firstName: 'Different',
				lastName: 'User',
			});

			const result = await getUsersByEmail({
				email: 'emailsearch',
				limit: 10,
			});

			expect(result.data).toHaveLength(2);
			expect(result.data[0].email).toMatch(/emailsearch/);
			expect(result.data[1].email).toMatch(/emailsearch/);
		});
	});
});
